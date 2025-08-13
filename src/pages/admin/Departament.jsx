import axios from 'axios'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import * as XLSX from 'xlsx'

const Department = () => {
	const token = localStorage.getItem('token')
	const [departments, setDepartments] = useState([])
	const [users, setUsers] = useState([])
	const [head, setHead] = useState(null)
	const [name, setName] = useState('')
	const [description, setDescription] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [exportLoading, setExportLoading] = useState(false)
	const [activeTab, setActiveTab] = useState('list')
	const [searchTerm, setSearchTerm] = useState('')
	const [editingId, setEditingId] = useState(null)
	const [editHead, setEditHead] = useState(null)

	// Fetch all departments
	const fetchDepartments = async () => {
		setIsLoading(true)
		try {
			const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/departament/getAll`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			if (res.data.success) {
				setDepartments(res.data.departments)
			} else {
				toast.error(res.data.message)
			}
		} catch (error) {
			toast.error("Server xatosi")
		} finally {
			setIsLoading(false)
		}
	}

	// Fetch all users
	const fetchUsers = async () => {
		try {
			const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/user/getAll`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			if (res.data.success) {
				setUsers(res.data.users)
			} else {
				toast.error(res.data.message)
			}
		} catch (error) {
			toast.error("Server xatosi")
		}
	}

	// Create or update department
	const handleSubmit = async (e) => {
		e.preventDefault()
		setIsLoading(true)
		try {
			const url = editingId
				? `${import.meta.env.VITE_BASE_URL}/api/departament/update/${editingId}`
				: `${import.meta.env.VITE_BASE_URL}/api/departament/createdepartament`

			const method = editingId ? 'put' : 'post'

			const res = await axios[method](
				url,
				{ name, description, head: head ? head._id : null },
				{ headers: { Authorization: `Bearer ${token}` } }
			)

			if (res.data.success) {
				toast.success(editingId ? "Bo'lim muvaffaqiyatli yangilandi!" : "Bo'lim muvaffaqiyatli qo'shildi!")
				resetForm()
				fetchDepartments()
				setActiveTab('list')
			} else {
				toast.error(res.data.message)
			}
		} catch (error) {
			toast.error("Serverda xatolik")
		} finally {
			setIsLoading(false)
		}
	}

	// Edit department
	const handleEdit = (dept) => {
		setEditingId(dept._id)
		setName(dept.name)
		setDescription(dept.description)
		setHead(dept.head || null)
		setActiveTab('create')
	}

	const resetForm = () => {
		setEditingId(null)
		setName('')
		setDescription('')
		setHead(null)
	}

	// Export to Excel
	const exportToExcel = async () => {
		setExportLoading(true)
		try {
			const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/departament/getAll`, {
				headers: { Authorization: `Bearer ${token}` },
			})

			if (res.data.success) {
				const exportData = res.data.departments.map((dept, index) => ({
					'№': index + 1,
					'Bo\'lim nomi': dept.name,
					'Tavsifi': dept.description || 'Mavjud emas',
					'Boshlig\'i': dept.head ? dept.head.fullName : 'Tayinlanmagan',
					'Lavozimi': dept.head ? dept.head.position : 'Tayinlanmagan',
					'Telefon': dept.head ? dept.head.phone : 'Mavjud emas',
					'HODIMID': dept.head ? dept.head.hodimID : 'Mavjud emas',
					'Yaratilgan sana': new Date(dept.createdAt).toLocaleDateString('uz-UZ'),
				}))

				const ws = XLSX.utils.json_to_sheet(exportData)
				const wb = XLSX.utils.book_new()
				XLSX.utils.book_append_sheet(wb, ws, "Bo'limlar")
				XLSX.writeFile(wb, `barcha_bolimlar_${new Date().toISOString().slice(0, 10)}.xlsx`)
				toast.success("Excel fayliga yuklandi!")
			}
		} catch (error) {
			toast.error("Export qilishda xatolik")
		} finally {
			setExportLoading(false)
		}
	}

	// Filter departments
	const filteredDepartments = departments.filter(dept =>
		dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
		(dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
		(dept.head && dept.head.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
	)

	useEffect(() => {
		fetchDepartments()
		fetchUsers()
	}, [])

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="mx-auto">
				<motion.div
					key={activeTab}
					initial={{ opacity: 0, x: activeTab === 'list' ? -20 : 20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.3 }}
					className="bg-white rounded-xl shadow-md overflow-hidden"
				>
					{/* Tabs */}
					<div className="flex justify-center border-b py-4 border-gray-200">
						<div className="flex">
							<button
								className={`px-6 py-4 font-bold text-sm rounded-3xl sm:text-base ${activeTab === 'list' ? 'text-white bg-indigo-600' : 'text-gray-600 hover:text-gray-800'
									}`}
								onClick={() => {
									resetForm()
									setActiveTab('list')
								}}
							>
								Bo'limlar
							</button>
							<button
								className={`px-6 py-4 font-bold rounded-3xl text-sm sm:text-base ${activeTab === 'create' ? 'text-white bg-indigo-600' : 'text-gray-600 hover:text-gray-800'
									}`}
								onClick={() => {
									resetForm()
									setActiveTab('create')
								}}
							>
								{editingId ? "Bo'limni tahrirlash" : "Bo'lim qo'shish"}
							</button>
						</div>
					</div>

					<div className="p-4 sm:p-6">
						{activeTab === 'list' ? (
							<div>
								<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
									<h2 className="text-xl sm:text-2xl font-bold text-indigo-700">
										Bo'limlar ro'yxati
									</h2>

									<div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
										<div className="relative">
											<input
												type="text"
												placeholder="Qidirish..."
												value={searchTerm}
												onChange={(e) => setSearchTerm(e.target.value)}
												className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full"
											/>
											<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
												<svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
												</svg>
											</div>
										</div>

										{departments.length > 0 && (
											<button
												onClick={exportToExcel}
												disabled={exportLoading}
												className={`px-4 py-2 text-white rounded-lg font-medium flex items-center justify-center ${exportLoading ? 'bg-green-700' : 'bg-green-600 hover:bg-green-700'
													}`}
											>
												{exportLoading ? (
													<>
														<svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
															<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
															<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
														</svg>
														Yuklanmoqda...
													</>
												) : (
													<>
														<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
														</svg>
														Excelga yuklash
													</>
												)}
											</button>
										)}
									</div>
								</div>

								{isLoading ? (
									<div className="flex justify-center py-12">
										<motion.div
											animate={{ rotate: 360 }}
											transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
											className="h-12 w-12 rounded-full border-4 border-t-blue-500 border-r-blue-300 border-b-blue-100 border-l-transparent"
										/>
									</div>
								) : filteredDepartments.length === 0 ? (
									<div className="text-center py-12">
										<div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
											<svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
										</div>
										<h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-800">
											{searchTerm ? "Natija topilmadi" : "Bo'limlar topilmadi"}
										</h3>
										<p className="text-gray-600 mb-4">
											{searchTerm ? "Qidiruv bo'yicha hech narsa topilmadi" : "Birorta ham bo'lim mavjud emas"}
										</p>
										<button
											onClick={() => setActiveTab('create')}
											className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
										>
											Yangi bo'lim qo'shish
										</button>
									</div>
								) : (
									<div className="overflow-x-auto">
										<table className="min-w-full divide-y divide-gray-200">
											<thead className="bg-gray-50">
												<tr>
													<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
														№
													</th>
													<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
														Nomi
													</th>
													<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
														Tavsifi
													</th>
													<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
														Boshlig'i
													</th>
													<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
														Harakatlar
													</th>
												</tr>
											</thead>
											<tbody className="bg-white divide-y divide-gray-200">
												{filteredDepartments.map((dept, index) => (
													<motion.tr
														key={dept._id}
														initial={{ opacity: 0 }}
														animate={{ opacity: 1 }}
														transition={{ duration: 0.3 }}
														className="hover:bg-gray-50"
													>
														<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
															{index + 1}
														</td>
														<td className="px-6 py-4 whitespace-nowrap">
															<div className="font-medium text-indigo-600">
																{dept.name}
															</div>
														</td>
														<td className="px-6 py-4">
															<div className="text-sm text-gray-800 max-w-xs truncate">
																{dept.description || 'Mavjud emas'}
															</div>
														</td>
														<td className="px-6 py-4 whitespace-nowrap">
															{dept.head ? (
																<div className="flex items-center">
																	<div className="flex-shrink-0 h-10 w-10 rounded-full bg-pink-600 flex items-center justify-center text-white font-bold">
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
																		<div className="text-sm font-medium text-gray-900">
																			{dept.head.fullName}
																		</div>
																		<div className="text-xs text-blue-500">
																			{dept.head.position}
																		</div>
																	</div>
																</div>
															) : (
																<span className="text-sm italic text-yellow-600">
																	Tayinlanmagan
																</span>
															)}
														</td>
														<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
															<div className="flex items-center space-x-2">
																<button
																	onClick={() => handleEdit(dept)}
																	className="text-indigo-600 hover:text-indigo-900"
																>
																	<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
																	</svg>
																</button>
															</div>
														</td>
													</motion.tr>
												))}
											</tbody>
										</table>
									</div>
								)}
							</div>
						) : (
							<div>
								<h2 className="text-xl sm:text-2xl text-center font-bold mb-6 text-indigo-700">
									{editingId ? "Bo'limni tahrirlash" : "Yangi bo'lim qo'shish"}
								</h2>
								<form onSubmit={handleSubmit}>
									<div className="flex flex-col md:flex-row gap-6 mb-6">
										<div className="flex-1">
											<label htmlFor="name" className="block text-sm sm:text-base font-medium mb-2 text-gray-800">
												Bo'lim nomi <span className="text-red-500">*</span>
											</label>
											<input
												id="name"
												type="text"
												value={name}
												onChange={(e) => setName(e.target.value)}
												placeholder="Axborot-kommunikatsiya texnologiyalarini rivojlantirish markazi"
												className="w-full px-4 text-black py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
												required
											/>
											<p className="mt-1 text-xs sm:text-sm text-blue-500">
												Har bir bo'lim bir marta kiritish mumkin
											</p>
										</div>

										<div className="flex-1">
											<label htmlFor="head" className="block text-sm sm:text-base font-medium mb-2 text-gray-800">
												Bo'lim boshlig'i
											</label>
											<select
												id="head"
												onChange={(e) => setHead(users.find(u => u._id === e.target.value))}
												value={head?._id || ''}
												className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition appearance-none"
												style={{
													backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234F46E5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7' /%3E%3C/svg%3E")`,
													backgroundRepeat: 'no-repeat',
													backgroundPosition: 'right 0.75rem center',
													backgroundSize: '1em'
												}}
											>
												<option value="" className="text-gray-400">Xodimni tanlang</option>
												{users.map(user => (
													<option key={user._id} value={user._id} className="text-gray-800">
														{user.fullName}
													</option>
												))}
											</select>
											{head && (
												<div className="mt-3 flex items-center">
													<div className="w-8 h-8 text-black rounded-full bg-pink-600 flex items-center justify-center  font-bold mr-2">
														{head.fullName.charAt(0)}
													</div>
													<span className="text-sm text-gray-800">{head.fullName}</span>
												</div>
											)}
										</div>
									</div>

									<div className="mb-6">
										<label htmlFor="description" className="block text-sm sm:text-base font-medium mb-2 text-gray-800">
											Bo'lim haqida ma'lumot
										</label>
										<textarea
											id="description"
											value={description}
											onChange={(e) => setDescription(e.target.value)}
											placeholder="Bo'limning vazifalari va maqsadlari..."
											rows={4}
											className="w-full px-4 text-black py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
										/>
										<p className="mt-1 text-xs sm:text-sm text-blue-500">
											Bu boshqa xodimlar uchun foydali ma'lumot bo'ladi
										</p>
									</div>

									<div className="flex justify-end gap-4">
										<button
											type="button"
											onClick={() => {
												resetForm()
												setActiveTab('list')
											}}
											className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
										>
											Bekor qilish
										</button>
										<button
											type="submit"
											disabled={isLoading}
											className={`px-6 py-2 rounded-lg font-medium text-white shadow-sm hover:shadow-md transition-all ${isLoading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
												}`}
										>
											{isLoading ? (
												<span className="flex items-center justify-center">
													<motion.span
														animate={{ rotate: 360 }}
														transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
														className="inline-block w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full mr-2"
													/>
													{editingId ? "Saqlanmoqda..." : "Qo'shilmoqda..."}
												</span>
											) : (
												<span>{editingId ? "Saqlash" : "Qo'shish"}</span>
											)}
										</button>
									</div>
								</form>
							</div>
						)}
					</div>
				</motion.div>
			</div>
		</div>
	)
}

export default Department