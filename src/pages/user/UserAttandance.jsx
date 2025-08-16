import axios from 'axios'
import { useEffect, useState } from 'react'
import {
	FaClock,
	FaFilter,
	FaUserCheck,
	FaUsers,
	FaUserSlash,
	FaUserTimes
} from 'react-icons/fa'
import {
	FiRefreshCw,
	FiSearch
} from 'react-icons/fi'
import { PulseLoader } from 'react-spinners'
import { toast } from 'react-toastify'

const UserAttendance = () => {
	const token = localStorage.getItem('token')
	const [users, setUsers] = useState([])
	const [departments, setDepartments] = useState([])
	const [loading, setLoading] = useState(true)
	const [refreshing, setRefreshing] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedDepartment, setSelectedDepartment] = useState('all')
	const [selectedStatus, setSelectedStatus] = useState('all')

	// Check if user is late (arrived more than 5 minutes after first check-in)
	const isLate = (user) => {
		if (!user.firstCheckInTime || !user.lastCheckInTime) return false

		const firstCheckIn = new Date(user.firstCheckInTime)
		const actualCheckIn = new Date(user.lastCheckInTime)
		const diffMinutes = (actualCheckIn - firstCheckIn) / (1000 * 60)

		return diffMinutes > 5
	}

	// Format time display
	const formatTime = (timeString) => {
		if (!timeString || timeString === '-') return '-'
		const date = new Date(timeString)
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
	}

	// Fetch data
	const fetchData = async () => {
		try {
			setLoading(true)
			const [usersRes, deptRes] = await Promise.all([
				axios.get(`${import.meta.env.VITE_BASE_URL}/api/user/getAll`, {
					headers: { Authorization: `Bearer ${token}` },
				}),
				axios.get(`${import.meta.env.VITE_BASE_URL}/api/departament/getAll`, {
					headers: { Authorization: `Bearer ${token}` },
				})
			])

			if (usersRes.data.success && deptRes.data.success) {
				const processedUsers = usersRes.data.users.map(user => ({
					...user,
					attendanceStatus: user.attendanceStatus || 'kelmagan',
					entryTime: formatTime(user.lastCheckInTime) || '-',
					exitTime: formatTime(user.lastCheckOutTime) || '-',
					comment: user.lastComment || '-',
					isLate: isLate(user),
					lateMinutes: isLate(user) ?
						Math.floor((new Date(user.lastCheckInTime) - new Date(user.firstCheckInTime)) / (1000 * 60)) : 0
				}))

				processedUsers.sort((a, b) => {
					if (!a.lavel && !b.lavel) return 0
					if (!a.lavel) return 1
					if (!b.lavel) return -1
					return a.lavel - b.lavel
				})

				setUsers(processedUsers)
				setDepartments(deptRes.data.departments)
			}
		} catch (error) {
			toast.error("Ma'lumotlarni yuklashda xato")
		} finally {
			setLoading(false)
			setRefreshing(false)
		}
	}

	// Count late arrivals
	const countLateArrivals = () => {
		return users.filter(user =>
			user.attendanceStatus === 'ishda' || user.attendanceStatus === 'tashqarida' && user.isLate
		).length
	}

	// Status functions
	const getStatusIcon = (status) => {
		switch (status) {
			case 'ishda': return <FaUserCheck className="text-emerald-500" />
			case 'kelmagan': return <FaUserTimes className="text-rose-500" />
			case 'tashqarida': return <FaUserSlash className="text-blue-500" />
			default: return <FaUserTimes className="text-rose-500" />
		}
	}

	const getStatusColor = (status) => {
		switch (status) {
			case 'ishda': return 'bg-emerald-100 text-emerald-800'
			case 'kelmagan': return 'bg-rose-100 text-rose-800'
			case 'tashqarida': return 'bg-blue-100 text-blue-800'
			default: return 'bg-rose-100 text-rose-800'
		}
	}

	const getStatusText = (status) => {
		switch (status) {
			case 'ishda': return 'Ishda'
			case 'kelmagan': return 'Kelmadi'
			case 'tashqarida': return 'Tashqarida'
			default: return 'Kelmadi'
		}
	}

	// Filter users
	const filteredUsers = users.filter(user => {
		const matchesSearch =
			user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.hodimID?.toLowerCase().includes(searchTerm.toLowerCase())

		const matchesDepartment =
			selectedDepartment === 'all' ||
			(selectedDepartment === 'no-dept' && !user.department) ||
			user.department?._id === selectedDepartment

		const matchesStatus =
			selectedStatus === 'all' ||
			user.attendanceStatus === selectedStatus ||
			(selectedStatus === 'kelmagan' && !['ishda', 'tashqarida'].includes(user.attendanceStatus))

		return matchesSearch && matchesDepartment && matchesStatus
	})

	useEffect(() => {
		fetchData()
	}, [])

	return (
		<div className="min-h-screen bg-gray-50 p-4">
			{/* Header and Filters */}
			<div className="bg-white rounded-xl shadow p-4 mb-6">
				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
					<h1 className="text-xl font-bold text-indigo-600 flex items-center">
						<FaUsers className="text-indigo-500 mr-2" />
						Xodimlar Davomati
					</h1>

					<div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
						<div className="relative w-full sm:w-auto sm:flex-1 min-w-[180px]">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
								<FiSearch />
							</div>
							<input
								type="text"
								placeholder="Xodimlarni qidirish..."
								className="pl-10 pr-4 py-2 text-sm w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
						</div>

						<div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg w-full sm:w-auto min-w-[150px]">
							<FaFilter className="text-gray-500 flex-shrink-0" />
							<select
								className="bg-transparent text-gray-800 border-none focus:outline-none focus:ring-0 text-sm w-full"
								value={selectedDepartment}
								onChange={(e) => setSelectedDepartment(e.target.value)}
							>
								<option value="all">Barcha boʻlimlar</option>
								{departments.map(dept => (
									<option key={dept._id} value={dept._id}>{dept.name}</option>
								))}
								<option value="no-dept">Boʻlimsiz</option>
							</select>
						</div>

						<div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg w-full sm:w-auto min-w-[150px]">
							<FaFilter className="text-gray-500 flex-shrink-0" />
							<select
								className="bg-transparent text-gray-800 border-none focus:outline-none focus:ring-0 text-sm w-full"
								value={selectedStatus}
								onChange={(e) => setSelectedStatus(e.target.value)}
							>
								<option value="all">Barcha holatlar</option>
								<option value="ishda">Ishda</option>
								<option value="kelmagan">Kelmagan</option>
								<option value="tashqarida">Tashqarida</option>
							</select>
						</div>

						<button
							onClick={() => {
								setRefreshing(true)
								fetchData()
							}}
							disabled={refreshing}
							className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
							title="Yangilash"
						>
							{refreshing ? (
								<PulseLoader size={6} color="white" />
							) : (
								<>
									<FiRefreshCw size={14} />
									<span>Yangilash</span>
								</>
							)}
						</button>
					</div>
				</div>
			</div>

			{/* Stats Summary */}
			<div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
				<div className="bg-white rounded-lg shadow p-4 flex items-center">
					<div className="p-3 rounded-full bg-emerald-100 text-emerald-600 mr-4">
						<FaUserCheck size={20} />
					</div>
					<div>
						<p className="text-sm font-medium text-gray-500">Ishda</p>
						<p className="text-xl font-bold text-emerald-600">
							{users.filter(u => u.attendanceStatus === 'ishda').length}
						</p>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow p-4 flex items-center">
					<div className="p-3 rounded-full bg-rose-100 text-rose-600 mr-4">
						<FaUserTimes size={20} />
					</div>
					<div>
						<p className="text-sm font-medium text-gray-500">Kelmagan</p>
						<p className="text-xl font-bold text-rose-600">
							{users.filter(u =>
								u.attendanceStatus === 'kelmagan' ||
								!['ishda', 'tashqarida'].includes(u.attendanceStatus)
							).length}
						</p>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow p-4 flex items-center">
					<div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
						<FaUserSlash size={20} />
					</div>
					<div>
						<p className="text-sm font-medium text-gray-500">Tashqarida</p>
						<p className="text-xl font-bold text-blue-600">
							{users.filter(u => u.attendanceStatus === 'tashqarida').length}
						</p>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow p-4 flex items-center">
					<div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
						<FaClock size={20} />
					</div>
					<div>
						<p className="text-sm font-medium text-gray-500">Kechikkan</p>
						<p className="text-xl font-bold text-yellow-600">
							{countLateArrivals()}
						</p>
					</div>
				</div>
			</div>

			{/* Users Table */}
			<div className="bg-white rounded-xl shadow overflow-hidden">
				{loading ? (
					<div className="flex justify-center items-center h-64">
						<PulseLoader color="#6366F1" size={15} />
					</div>
				) : filteredUsers.length === 0 ? (
					<div className="text-center py-12">
						<div className="mx-auto h-24 w-24 text-gray-400 mb-4">
							<FaUserTimes className="w-full h-full" />
						</div>
						<h3 className="text-lg font-medium text-gray-900">Xodimlar topilmadi</h3>
						<p className="text-sm text-gray-500 mt-1">
							{searchTerm ? "Qidiruv bo'yicha xodim topilmadi" : "Tizimda xodimlar mavjud emas"}
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-4 py-3 text-left text-xs font-medium text-gray-500  tracking-wider">№</th>
									<th className="px-4 py-3 text-left text-xs font-medium text-gray-500  tracking-wider">Xodim</th>
									<th className="px-4 py-3 text-left text-xs font-medium text-gray-500  tracking-wider">Lavozim</th>
									<th className="px-4 py-3 text-left text-xs font-medium text-gray-500  tracking-wider">Boʻlim</th>
									<th className="px-4 py-3 text-left text-xs font-medium text-gray-500  tracking-wider">Telefon(qisqa raqam)</th>
									<th className="px-4 py-3 text-left text-xs font-medium text-gray-500  tracking-wider">Kirish</th>
									<th className="px-4 py-3 text-left text-xs font-medium text-gray-500  tracking-wider">Chiqish</th>
									<th className="px-4 py-3 text-left text-xs font-medium text-gray-500  tracking-wider">Izoh</th>
									<th className="px-4 py-3 text-left text-xs font-medium text-gray-500  tracking-wider">Holat</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{filteredUsers.map((user, index) => (
									<tr key={user._id} className={`
                    hover:bg-opacity-90
                    ${!user.attendanceStatus || user.attendanceStatus === 'kelmagan'
											? 'bg-red-50 hover:bg-red-100'
											: user.attendanceStatus === 'ishda'
												? 'bg-green-50 hover:bg-green-100'
												: 'bg-blue-50 hover:bg-blue-100'
										}
                  `}>
										<td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
											<div className="flex items-center">
												{index + 1}
												{user.isLate && (
													<span className="ml-2 text-yellow-500" title={`${user.lateMinutes} daqiqa kechikkan`}>
														<FaClock className="inline" size={12} />
													</span>
												)}
											</div>
										</td>
										<td className="px-4 py-4">
											<div className="flex items-center">
												<div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
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
												<div className="ml-3">
													<p className="text-sm font-medium text-gray-900 flex items-center">
														{user.fullName}
													</p>
													<p className="text-xs text-gray-500">
														@{user.username}
													</p>
												</div>
											</div>
										</td>
										<td className="px-4 py-4 text-sm text-gray-900">
											{user.position}
										</td>
										<td className="px-4 py-4 text-sm text-gray-900">
											{user.department?.name || "Boʻlimsiz"}
										</td>
										<td className="px-4 py-4 text-sm text-gray-900">
											{user.phone_personal || user.phone_work
												? `${user.phone_personal || ''}${user.phone_personal && user.phone_work ? ' (' : ''}${user.phone_work || ''}${user.phone_personal && user.phone_work ? ')' : ''}`
												: '-'}
										</td>
										<td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
											<div className="flex items-center">
												{user.entryTime}

											</div>
										</td>
										<td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
											{user.exitTime}
										</td>
										<td className="px-4 py-4 text-sm text-gray-900">
											{user.comment}
										</td>
										<td className="px-4 py-4 whitespace-nowrap">
											<div className="flex items-center">
												<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.attendanceStatus)
													}`}>
													{getStatusIcon(user.attendanceStatus)}
													<span className="ml-1.5">
														{getStatusText(user.attendanceStatus)}
													</span>
												</span>

											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	)
}

export default UserAttendance