import axios from 'axios'
import { useEffect, useState } from 'react'
import {
	FaUserCheck,
	FaUsers,
	FaUserSlash,
	FaUserTimes
} from 'react-icons/fa'
import {
	FiCalendar,
	FiChevronRight,
	FiClock,
	FiRefreshCw,
	FiSearch
} from 'react-icons/fi'
import { PulseLoader } from 'react-spinners'
import { toast } from 'react-toastify'
import UserAttendanceModal from './UserAttendanceModal'

const AdminAttendance = () => {
	const token = localStorage.getItem('token')
	const [departments, setDepartments] = useState([])
	const [loading, setLoading] = useState(true)
	const [searchTerm, setSearchTerm] = useState('')
	const [refreshing, setRefreshing] = useState(false)
	const [activeTab, setActiveTab] = useState('all')
	const [selectedUserId, setSelectedUserId] = useState(null)

	// Ma'lumotlarni yuklash
	const fetchDepartmentsWithUsers = async () => {
		try {
			setLoading(true)
			const [deptRes, usersRes] = await Promise.all([
				axios.get(`${import.meta.env.VITE_BASE_URL}/api/departament/getAll`, {
					headers: { Authorization: `Bearer ${token}` },
				}),
				axios.get(`${import.meta.env.VITE_BASE_URL}/api/user/getAll`, {
					headers: { Authorization: `Bearer ${token}` },
				}),
			])

			if (deptRes.data.success && usersRes.data.success) {
				const departmentColors = [
					'bg-indigo-100 text-indigo-800 border-indigo-200',
					'bg-blue-100 text-blue-800 border-blue-200',
					'bg-emerald-100 text-emerald-800 border-emerald-200',
					'bg-amber-100 text-amber-800 border-amber-200',
					'bg-rose-100 text-rose-800 border-rose-200',
					'bg-purple-100 text-purple-800 border-purple-200',
				]

				// Add default status for users without attendanceStatus
				const usersWithDefaultStatus = usersRes.data.users.map(user => ({
					...user,
					attendanceStatus: user.attendanceStatus || 'kelmagan'
				}))

				const departmentsWithUsers = deptRes.data.departments.map((dept, index) => ({
					...dept,
					users: usersWithDefaultStatus.filter(user => user.department?._id === dept._id),
					badgeStyle: `${departmentColors[index % departmentColors.length]}`
				}))

				const noDeptUsers = usersWithDefaultStatus.filter(user => !user.department)
				if (noDeptUsers.length > 0) {
					departmentsWithUsers.push({
						_id: 'no-department',
						name: "Bo'limi yo'q",
						users: noDeptUsers,
						badgeStyle: 'bg-gray-100 text-gray-800 border-gray-200',
					})
				}

				setDepartments(departmentsWithUsers)
			}
		} catch (error) {
			toast.error("Ma'lumotlarni yuklashda xato yuz berdi")
			console.error('Ma\'lumotlarni yuklashda xato:', error)
		} finally {
			setLoading(false)
			setRefreshing(false)
		}
	}

	// Statusga qarab ikonga
	const getStatusIcon = (status) => {
		switch (status) {
			case 'ishda':
				return <FaUserCheck className="text-emerald-500" />
			case 'kelmagan':
				return <FaUserTimes className="text-rose-500" />
			case 'tashqarida':
				return <FaUserSlash className="text-blue-500" />
			default:
				return <FaUserTimes className="text-rose-500" />
		}
	}

	// Statusga qarab rang
	const getStatusColor = (status) => {
		switch (status) {
			case 'ishda':
				return 'bg-emerald-100 text-emerald-800'
			case 'kelmagan':
				return 'bg-rose-100 text-rose-800'
			case 'tashqarida':
				return 'bg-blue-100 text-blue-800'
			default:
				return 'bg-rose-100 text-rose-800'
		}
	}

	// Status matni
	const getStatusText = (status) => {
		switch (status) {
			case 'ishda':
				return 'Ishda'
			case 'kelmagan':
				return 'Kelmadi'
			case 'tashqarida':
				return 'Tashqarida'
			default:
				return 'Kelmadi'
		}
	}

	// Foydalanuvchi avatarini yaratish
	const UserAvatar = ({ user }) => {
		return (
			<div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
				{user.photo ? (
					<img
						src={`${import.meta.env.VITE_BASE_URL}/uploads/${user.photo}`}
						alt={user.fullName}
						className="h-full w-full rounded-full object-cover"
					/>
				) : (
					user.fullName?.charAt(0)?.toUpperCase()
				)}
			</div>
		)
	}

	// Qidiruv va tab bo'yicha filtrlash
	const filteredDepartments = departments
		.map(dept => ({
			...dept,
			users: dept.users.filter(user => {
				// Qidiruv bo'yicha filtrlash
				const matchesSearch =
					user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
					user.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
					user.username?.toLowerCase().includes(searchTerm.toLowerCase())

				// Tab bo'yicha filtrlash
				const matchesTab =
					activeTab === 'all' ||
					(activeTab === 'ishda' && user.attendanceStatus === 'ishda') ||
					(activeTab === 'kelmagan' && (
						user.attendanceStatus === 'kelmagan' ||
						(!['ishda', 'tashqarida'].includes(user.attendanceStatus))
					)) ||
					(activeTab === 'tashqarida' && user.attendanceStatus === 'tashqarida')

				return matchesSearch && matchesTab
			}),
		}))
		.filter(dept => dept.users.length > 0)

	useEffect(() => {
		fetchDepartmentsWithUsers()
	}, [])

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="bg-white shadow-sm">
				<div className="mx-auto px-4 py-6 sm:px-6 lg:px-8">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
						<div>
							<h1 className="text-2xl font-bold text-gray-900 flex items-center">
								<span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
									Davomat Monitoringi
								</span>
								<span className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
									Real-time
								</span>
							</h1>
							<p className="text-sm text-gray-500 mt-1 flex items-center">
								<FiClock className="mr-1.5 text-indigo-500" />
								Xodimlarning ish vaqtini nazorat qilish tizimi
							</p>
						</div>

						<div className="flex items-center space-x-3 w-full md:w-auto">
							<div className="relative rounded-full shadow-sm w-full md:w-64">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<FiSearch className="h-4 w-4 text-gray-400" />
								</div>
								<input
									type="text"
									className="block w-full pl-10 pr-3 text-black py-2 text-sm border-gray-300 rounded-full border focus:ring-indigo-500 focus:border-indigo-500"
									placeholder="Xodimni qidirish..."
									value={searchTerm}
									onChange={e => setSearchTerm(e.target.value)}
								/>
							</div>

							<button
								onClick={() => {
									setRefreshing(true)
									fetchDepartmentsWithUsers()
								}}
								disabled={refreshing}
								className="flex items-center justify-center p-2 rounded-full bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors"
								title="Yangilash"
							>
								{refreshing ? (
									<PulseLoader size={6} color="#6B7280" />
								) : (
									<FiRefreshCw className="h-5 w-5" />
								)}
							</button>
						</div>
					</div>

					{/* Filter tabs */}
					<div className="flex space-x-2 mt-4 overflow-x-auto pb-2">
						{[
							{ value: 'all', label: 'Hammasi', icon: <FaUsers className="mr-1.5" /> },
							{ value: 'ishda', label: 'Ishda', icon: <FaUserCheck className="mr-1.5" /> },
							{ value: 'kelmagan', label: 'Kelmagan', icon: <FaUserTimes className="mr-1.5" /> },
							{ value: 'tashqarida', label: 'Tashqarida', icon: <FaUserSlash className="mr-1.5" /> },
						].map((tab) => (
							<button
								key={tab.value}
								onClick={() => setActiveTab(tab.value)}
								className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center transition-colors ${activeTab === tab.value
									? 'bg-indigo-100 text-indigo-800'
									: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
									}`}
							>
								{tab.icon}
								{tab.label}
							</button>
						))}
					</div>
				</div>
			</header>

			{/* Main content */}
			<main className="mx-auto px-4 py-6 sm:px-6 lg:px-8">
				{loading ? (
					<div className="flex justify-center items-center h-64">
						<PulseLoader color="#6366F1" size={15} />
					</div>
				) : filteredDepartments.length === 0 ? (
					<div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
						<div className="mx-auto h-24 w-24 text-gray-400">
							<FaUserSlash className="w-full h-full" />
						</div>
						<h3 className="mt-2 text-lg font-medium text-gray-900">Xodimlar topilmadi</h3>
						<p className="mt-1 text-sm text-gray-500">
							{searchTerm ? "Qidiruv bo'yicha xodim topilmadi" : "Tizimda xodimlar mavjud emas"}
						</p>
					</div>
				) : (
					<div className="space-y-6">
						{filteredDepartments.map(dept => (
							<section
								key={dept._id}
								className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200"
							>
								<div className="px-6 py-4 flex justify-between items-center border-b border-gray-200">
									<div className="flex items-center space-x-3">
										<span className={`px-3 py-1 rounded-full text-xs font-medium border ${dept.badgeStyle}`}>
											{dept.name}
										</span>
										<span className="text-sm text-gray-500">
											{dept.users.length} ta xodim
										</span>
									</div>
									<span className="text-xs text-gray-500">
										ID: {dept._id.slice(-4)}
									</span>
								</div>

								<div className="divide-y divide-gray-200">
									{dept.users.map(user => (
										<div
											key={user._id}
											className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-between group"
											onClick={() => setSelectedUserId(user._id)}
										>
											<div className="flex items-center space-x-4">
												<UserAvatar user={user} />
												<div>
													<h3 className="text-base font-medium text-gray-900 group-hover:text-indigo-600">
														{user.fullName}
													</h3>
													<div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
														<p className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
															{user.position || "Lavozim ko'rsatilmagan"}
														</p>
														{user.username && (
															<p className="text-xs text-gray-500">@{user.username}</p>
														)}
													</div>
												</div>
											</div>
											<div className="flex items-center space-x-4">
												<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.attendanceStatus)
													}`}>
													{getStatusIcon(user.attendanceStatus)}
													<span className="ml-1.5">{getStatusText(user.attendanceStatus)}</span>
												</span>
												<FiChevronRight className="text-gray-400 group-hover:text-indigo-500" />
											</div>
										</div>
									))}
								</div>
							</section>
						))}
					</div>
				)}
			</main>

			{/* Stats footer */}
			<footer className="bg-white border-t border-gray-200 py-4 px-6">
				<div className="flex flex-wrap items-center justify-between text-sm text-gray-500">
					<div className="flex items-center space-x-4">
						<span className="flex items-center">
							<FaUserCheck className="text-emerald-500 mr-1.5" />
							Ishda: {departments.reduce((acc, dept) =>
								acc + dept.users.filter(u => u.attendanceStatus === 'ishda').length, 0
							)}
						</span>
						<span className="flex items-center">
							<FaUserTimes className="text-rose-500 mr-1.5" />
							Kelmagan: {departments.reduce((acc, dept) =>
								acc + dept.users.filter(u =>
									u.attendanceStatus === 'kelmagan' ||
									!['ishda', 'tashqarida'].includes(u.attendanceStatus)
								).length, 0
							)}
						</span>
						<span className="flex items-center">
							<FaUserSlash className="text-blue-500 mr-1.5" />
							Tashqarida: {departments.reduce((acc, dept) =>
								acc + dept.users.filter(u => u.attendanceStatus === 'tashqarida').length, 0
							)}
						</span>
					</div>
					<div className="flex items-center">
						<FiCalendar className="mr-1.5 text-indigo-500" />
						{new Date().toLocaleDateString('uz-UZ', {
							weekday: 'long',
							year: 'numeric',
							month: 'long',
							day: 'numeric'
						})}
					</div>
				</div>
			</footer>

			{/* User Attendance Modal */}
			{selectedUserId && (
				<UserAttendanceModal
					userId={selectedUserId}
					onClose={() => setSelectedUserId(null)}
				/>
			)}
		</div>
	)
}

export default AdminAttendance