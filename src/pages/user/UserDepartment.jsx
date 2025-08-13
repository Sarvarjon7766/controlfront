import axios from 'axios'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { FiSearch, FiUsers } from 'react-icons/fi'
import { toast } from 'react-toastify'

const UserDepartment = () => {
	const token = localStorage.getItem('token')
	const [departments, setDepartments] = useState([])
	const [users, setUsers] = useState([])
	const [isLoading, setIsLoading] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')

	// Fetch all departments
	const fetchDepartments = async () => {
		setIsLoading(true)
		try {
			const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/departament/getAll`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})
			if (res.data.success) {
				setDepartments(res.data.departments)
			} else {
				toast.error(res.data.message)
			}
		} catch (error) {
			toast.error("Server bilan aloqa xatosi")
		} finally {
			setIsLoading(false)
		}
	}

	const fetchUsers = async () => {
		try {
			const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/user/getAll`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})
			if (res.data.success) {
				setUsers(res.data.users)
			} else {
				toast.error(res.data.message)
			}
		} catch (error) {
			toast.error("Foydalanuvchilarni yuklashda xatolik")
		}
	}

	useEffect(() => {
		fetchDepartments()
		fetchUsers()
	}, [])

	// Filter departments based on search term
	const filteredDepartments = departments.filter(dept =>
		dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
		(dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
		(dept.head && dept.head.fullName.toLowerCase().includes(searchTerm.toLowerCase())))

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
			<div className="mx-auto">
				{/* Header Section */}
				<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
					<div>
						<h1 className="text-3xl font-bold text-gray-800 flex items-center">
							<span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
								Bo'limlar Boshqaruvi
							</span>
						</h1>
						<p className="text-gray-600 mt-2">
							<span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
								Tizimdagi barcha bo'limlar ro'yxati
							</span>
						</p>
					</div>

					<div className="flex gap-3 w-full md:w-auto">
						{/* Search Input */}
						<div className="relative flex-1 md:w-64">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<FiSearch className="text-gray-400" />
							</div>
							<input
								type="text"
								placeholder="Qidirish..."
								className="block w-full text-black pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-200"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
						</div>
					</div>
				</div>

				{/* Main Content */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.3 }}
					className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100"
				>
					<div className="p-4 sm:p-6">
						{isLoading ? (
							<div className="flex justify-center py-12">
								<motion.div
									animate={{ rotate: 360 }}
									transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
									className="h-12 w-12 rounded-full border-4 border-t-indigo-500 border-r-indigo-300 border-b-indigo-100 border-l-transparent"
								/>
							</div>
						) : filteredDepartments.length === 0 ? (
							<div className="text-center py-12">
								<div className="inline-flex items-center justify-center p-4 bg-blue-50 rounded-full mb-4">
									<FiUsers className="w-10 h-10 text-blue-600" />
								</div>
								<h3 className="text-xl font-bold text-gray-800 mb-2">
									{searchTerm ? "Natija topilmadi" : "Bo'limlar mavjud emas"}
								</h3>
								<p className="text-gray-600 mb-4 max-w-md mx-auto">
									{searchTerm
										? "Qidiruv bo'yicha hech qanday bo'lim topilmadi"
										: "Hozircha tizimda birorta ham bo'lim mavjud emas"}
								</p>
							</div>
						) : (
							<div className="overflow-hidden rounded-lg border border-gray-200">
								<table className="min-w-full divide-y divide-gray-200">
									<thead className="bg-gradient-to-r from-gray-50 to-indigo-50">
										<tr>
											<th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
												Bo'lim nomi
											</th>
											<th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
												Tavsifi
											</th>
											<th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
												Boshlig'i
											</th>

										</tr>
									</thead>
									<tbody className="bg-white divide-y divide-gray-200">
										{filteredDepartments.map((dept) => (
											<motion.tr
												key={dept._id}
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												transition={{ duration: 0.3 }}
												className="hover:bg-gray-50 transition-colors"
											>
												<td className="px-6 py-4 whitespace-nowrap">
													<div className="flex items-center">
														<div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-indigo-100 to-blue-100 flex items-center justify-center text-indigo-600 font-bold">
															{dept.name.charAt(0)}
														</div>
														<div className="ml-4">
															<div className="text-sm font-semibold text-gray-900">{dept.name}</div>
														</div>
													</div>
												</td>
												<td className="px-6 py-4">
													<div className="text-sm text-gray-600 max-w-xs truncate">
														{dept.description || 'Tavsif mavjud emas'}
													</div>
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													{dept.head ? (
														<div className="flex items-center">
															<div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 flex items-center justify-center text-pink-600 font-bold">
																{dept.head.photo ? (
																	<img
																		src={`${import.meta.env.VITE_BASE_URL}/uploads/${dept.head.photo}`}
																		alt={dept.head.fullName}
																		className="h-10 w-10 rounded-full object-cover"
																	/>
																) : (
																	dept.head.fullName.charAt(0)
																)}
															</div>
															<div className="ml-4">
																<div className="text-sm font-medium text-gray-900">{dept.head.fullName}</div>
																<div className="text-xs text-blue-600 font-medium">Boshliq</div>
															</div>
														</div>
													) : (
														<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
															Tayinlanmagan
														</span>
													)}
												</td>

											</motion.tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</motion.div>
			</div>
		</div>
	)
}

export default UserDepartment