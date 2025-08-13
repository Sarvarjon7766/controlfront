import axios from 'axios'
import { useEffect, useState } from 'react'
import { FiChevronDown, FiChevronUp, FiFilter, FiSearch, FiUsers } from 'react-icons/fi'
import { ToastContainer } from 'react-toastify'

const UserUsers = () => {
	const token = localStorage.getItem('token')
	const [departments, setDepartments] = useState([])
	const [selectedDepartment, setSelectedDepartment] = useState(null)
	const [users, setUsers] = useState([])
	const [filteredUsers, setFilteredUsers] = useState([])
	const [searchTerm, setSearchTerm] = useState('')
	const [isLoading, setIsLoading] = useState(true)
	const [expandedDepartments, setExpandedDepartments] = useState({})

	const fetchDepartments = async () => {
		try {
			const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/departament/getAll`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})
			if (res.data.success) {
				setDepartments(res.data.departments)
				const expandedState = {}
				res.data.departments.forEach(dept => {
					expandedState[dept._id] = true
				})
				setExpandedDepartments(expandedState)
			}
		} catch (error) {
			console.error('Boʻlimlarni yuklashda xatolik:', error)
		}
	}

	const fetchUsers = async () => {
		setIsLoading(true)
		try {
			const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/user/getAll`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})
			console.log(res.data)
			if (res.data.success) {
				setUsers(res.data.users)
				setFilteredUsers(res.data.users)
			}
		} catch (error) {
			console.error('Foydalanuvchilarni yuklashda xatolik:', error)
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		fetchDepartments()
		fetchUsers()
	}, [])

	useEffect(() => {
		filterUsers()
	}, [selectedDepartment, searchTerm, users])

	const filterUsers = () => {
		let result = [...users]
		if (selectedDepartment && selectedDepartment !== 'all') {
			result = result.filter(user =>
				user.department && user.department._id === selectedDepartment
			)
		}
		if (searchTerm) {
			const term = searchTerm.toLowerCase()
			result = result.filter(user =>
				user.fullName.toLowerCase().includes(term) ||
				user.position.toLowerCase().includes(term))
		}
		setFilteredUsers(result)
	}

	const toggleDepartment = (deptId) => {
		setExpandedDepartments(prev => ({
			...prev,
			[deptId]: !prev[deptId]
		}))
	}

	const getUsersByDepartment = (deptId) => {
		return filteredUsers.filter(user =>
			user.department && user.department._id === deptId
		)
	}

	const getStatusClass = (status) => {
		switch (status) {
			case 'kelmagan':
				return 'bg-red-100 text-red-800'
			case 'tashqarida':
				return 'bg-yellow-100 text-yellow-800'
			case 'ishda':
				return 'bg-green-100 text-green-800'
			default:
				return 'bg-gray-100 text-gray-800'
		}
	}

	const getStatusText = (status) => {
		switch (status) {
			case 'kelmagan':
				return 'Kelmagan'
			case 'tashqarida':
				return 'Tashqarida'
			case 'ishda':
				return 'Ishda'
			default:
				return 'Noma\'lum'
		}
	}

	return (
		<div className="p-4 md:p-6 bg-gray-50 min-h-screen">
			<ToastContainer
				position="top-right"
				autoClose={5000}
				hideProgressBar={false}
				newestOnTop={false}
				closeOnClick
				rtl={false}
				pauseOnFocusLoss
				draggable
				pauseOnHover
				theme="light"
			/>

			{/* Header Section */}
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
				<div>
					<h1 className="text-3xl font-bold text-gray-800 flex items-center">
						<FiUsers className="mr-3 text-indigo-600" />
						<span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
							Xodimlar Boshqaruvi
						</span>
					</h1>
					<p className="text-gray-600 mt-2 font-medium">
						<span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md">
							Tizimdagi barcha xodimlar ro'yxati
						</span>
					</p>
				</div>
			</div>

			{/* Filter Section */}
			<div className="bg-white rounded-xl shadow-md p-5 mb-8 border border-gray-100">
				<div className="flex flex-col md:flex-row md:items-center gap-4">
					{/* Search Input */}
					<div className="relative flex-1">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<FiSearch className="text-gray-500" />
						</div>
						<input
							type="text"
							placeholder="Ism, familiya yoki lavozim boʻyicha qidirish..."
							className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 text-gray-700 transition-all duration-200"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>

					{/* Department Filter */}
					<div className="flex items-center gap-2 w-full md:w-auto">
						<div className="relative w-full md:w-64">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<FiFilter className="text-gray-500" />
							</div>
							<select
								className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none text-gray-700 transition-all duration-200"
								value={selectedDepartment}
								onChange={(e) => setSelectedDepartment(e.target.value)}
							>
								<option value={null} className="text-gray-500">Barcha boʻlimlar</option>
								{departments.map(dept => (
									<option key={dept._id} value={dept._id} className="text-gray-700">{dept.name}</option>
								))}
							</select>
						</div>
					</div>
				</div>
			</div>

			{/* Departments and Users List */}
			{isLoading ? (
				<div className="flex justify-center items-center p-12">
					<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
					<span className="ml-3 text-gray-600 font-medium">Ma'lumotlar yuklanmoqda...</span>
				</div>
			) : selectedDepartment ? (
				// Show selected department with its users
				<div className="space-y-6">
					<div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
						<div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
							<div className="flex justify-between items-center">
								<div>
									<h2 className="text-xl font-semibold text-gray-800">
										<span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
											{departments.find(d => d._id === selectedDepartment)?.name || 'Tanlangan boʻlim'}
										</span>
									</h2>
									<p className="text-gray-600 mt-1 font-medium">
										{getUsersByDepartment(selectedDepartment).length} ta xodim mavjud
									</p>
								</div>
								<button
									onClick={() => setSelectedDepartment(null)}
									className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
								>
									Barchasi
								</button>
							</div>
						</div>

						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200">
								<thead className="bg-gray-50">
									<tr>
										<th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rasm</th>
										<th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ism Familiya</th>
										<th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Lavozim</th>
										<th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Holati</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{getUsersByDepartment(selectedDepartment).length > 0 ? (
										getUsersByDepartment(selectedDepartment).map(user => (
											<tr key={user._id} className="hover:bg-gray-50 transition-colors">
												<td className="px-6 py-4 whitespace-nowrap">
													<div className="flex-shrink-0 h-10 w-10">
														{user.photo ? (
															<img
																className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm"
																src={`${import.meta.env.VITE_BASE_URL}/uploads/${user.photo}`}
																alt={user.fullName}
															/>
														) : (
															<div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-medium border-2 border-white shadow-sm">
																{user.fullName.split(' ').map(n => n[0]).join('')}
															</div>
														)}
													</div>
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<div className="text-sm font-semibold text-gray-900">{user.fullName}</div>
													<div className="text-xs text-gray-500 font-medium">ID: {user.hodimID}</div>
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<div className="text-sm text-gray-900 font-medium bg-blue-50 px-2 py-1 rounded-md inline-block">
														{user.position}
													</div>
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full shadow-sm ${getStatusClass(user.attendanceStatus)}`}>
														{getStatusText(user.attendanceStatus)}
													</span>
												</td>
											</tr>
										))
									) : (
										<tr>
											<td colSpan="4" className="px-6 py-12 text-center">
												<div className="flex flex-col items-center justify-center">
													<FiUsers className="h-16 w-16 text-gray-300 mb-4" />
													<h3 className="text-lg font-semibold text-gray-700">Xodimlar topilmadi</h3>
													<p className="text-gray-500 mt-2 max-w-md">
														Ushbu boʻlimda hozircha xodimlar mavjud emas yoki qidiruv boʻyicha hech narsa topilmadi
													</p>
												</div>
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			) : (
				// Show all departments with expandable user lists
				<div className="space-y-6">
					{departments.map(department => (
						<div key={department._id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
							<div
								className="p-6 border-b border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
								onClick={() => toggleDepartment(department._id)}
							>
								<div>
									<h2 className="text-xl font-semibold text-gray-800">
										<span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
											{department.name}
										</span>
									</h2>
									<p className="text-gray-600 mt-1 font-medium">
										{getUsersByDepartment(department._id).length} ta xodim
									</p>
								</div>
								<div className="text-gray-500 bg-gray-100 p-2 rounded-full">
									{expandedDepartments[department._id] ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
								</div>
							</div>

							{expandedDepartments[department._id] && (
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-gray-200">
										<thead className="bg-gray-50">
											<tr>
												<th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rasm</th>
												<th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ism Familiya</th>
												<th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Lavozim</th>
												<th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Holati</th>
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-200">
											{getUsersByDepartment(department._id).length > 0 ? (
												getUsersByDepartment(department._id).map(user => (
													<tr key={user._id} className="hover:bg-gray-50 transition-colors">
														<td className="px-6 py-4 whitespace-nowrap">
															<div className="flex-shrink-0 h-10 w-10">
																{user.photo ? (
																	<img
																		className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm"
																		src={`${import.meta.env.VITE_BASE_URL}/uploads/${user.photo}`}
																		alt={user.fullName}
																	/>
																) : (
																	<div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-medium border-2 border-white shadow-sm">
																		{user.fullName.split(' ').map(n => n[0]).join('')}
																	</div>
																)}
															</div>
														</td>
														<td className="px-6 py-4 whitespace-nowrap">
															<div className="text-sm font-semibold text-gray-900">{user.fullName}</div>
															<div className="text-xs text-gray-500 font-medium">ID: {user.hodimID}</div>
														</td>
														<td className="px-6 py-4 whitespace-nowrap">
															<div className="text-sm text-gray-900 font-medium bg-blue-50 px-2 py-1 rounded-md inline-block">
																{user.position}
															</div>
														</td>
														<td className="px-6 py-4 whitespace-nowrap">
															<span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full shadow-sm ${getStatusClass(user.attendanceStatus)}`}>
																{getStatusText(user.attendanceStatus)}
															</span>
														</td>
													</tr>
												))
											) : (
												<tr>
													<td colSpan="4" className="px-6 py-8 text-center">
														<div className="flex flex-col items-center justify-center">
															<FiUsers className="h-12 w-12 text-gray-300 mb-4" />
															<h3 className="text-lg font-semibold text-gray-700">Xodimlar topilmadi</h3>
															<p className="text-gray-500 mt-1">Ushbu boʻlimda hozircha xodimlar mavjud emas</p>
														</div>
													</td>
												</tr>
											)}
										</tbody>
									</table>
								</div>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	)
}

export default UserUsers