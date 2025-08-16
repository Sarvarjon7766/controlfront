import axios from 'axios'
import { useEffect, useState } from 'react'
import { FiEdit } from 'react-icons/fi'
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
				toast.success(editingId ? "Bo'lim yangilandi!" : "Bo'lim qo'shildi!")
				resetForm()
				fetchDepartments()
				setActiveTab('list')
			}
		} catch (error) {
			toast.error("Xatolik yuz berdi")
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
			const exportData = departments.map((dept, index) => ({
				'№': index + 1,
				'Nomi': dept.name,
				'Tavsifi': dept.description || 'Mavjud emas',
				'Boshlig\'i': dept.head ? dept.head.fullName : 'Tayinlanmagan',
				'Lavozimi': dept.head ? dept.head.position : 'Tayinlanmagan',
				'Yaratilgan sana': new Date(dept.createdAt).toLocaleDateString('uz-UZ'),
			}))

			const ws = XLSX.utils.json_to_sheet(exportData)
			const wb = XLSX.utils.book_new()
			XLSX.utils.book_append_sheet(wb, ws, "Bo'limlar")
			XLSX.writeFile(wb, `bo'limlar_${new Date().toISOString().slice(0, 10)}.xlsx`)
			toast.success("Excel fayliga yuklandi!")
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
		<div className="container mx-auto">
			<div className="bg-white rounded-lg shadow">
				{/* Tabs */}
				<div className="flex border-b">
					<button
						className={`px-6 py-3 font-medium ${activeTab === 'list' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
						onClick={() => {
							resetForm()
							setActiveTab('list')
						}}
					>
						Bo'limlar
					</button>
					<button
						className={`px-6 py-3 font-medium ${activeTab === 'create' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
						onClick={() => {
							resetForm()
							setActiveTab('create')
						}}
					>
						{editingId ? "Tahrirlash" : "Yangi bo'lim"}
					</button>
				</div>

				<div className="p-4">
					{activeTab === 'list' ? (
						<div>
							<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
								<h2 className="text-xl font-bold text-gray-800">Bo'limlar ro'yxati</h2>
								<div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
									<div className="relative flex-1">
										<input
											type="text"
											placeholder="Qidirish..."
											value={searchTerm}
											onChange={(e) => setSearchTerm(e.target.value)}
											className="pl-10 pr-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full"
										/>
										<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
											<svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
											</svg>
										</div>
									</div>
									<button
										onClick={exportToExcel}
										disabled={exportLoading}
										className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium flex items-center justify-center hover:bg-green-700"
									>
										{exportLoading ? (
											<>
												<svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
													<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
													<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
												</svg>
												Yuklanmoqda...
											</>
										) : 'Excelga yuklash'}
									</button>
								</div>
							</div>

							{isLoading ? (
								<div className="flex justify-center py-12">
									<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
								</div>
							) : filteredDepartments.length === 0 ? (
								<div className="text-center py-12">
									<div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
										<svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
									</div>
									<h3 className="text-lg font-semibold mb-2 text-gray-800">
										{searchTerm ? "Natija topilmadi" : "Bo'limlar mavjud emas"}
									</h3>
									<button
										onClick={() => setActiveTab('create')}
										className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
									>
										Yangi bo'lim qo'shish
									</button>
								</div>
							) : (
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-gray-200">
										<thead className="bg-gray-50">
											<tr>
												<th className="px-4 py-2 text-left text-sm font-medium text-gray-500">№</th>
												<th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Nomi</th>
												<th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Boshlig'i</th>
												<th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Harakatlar</th>
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-200">
											{filteredDepartments.map((dept, index) => (
												<tr key={dept._id} className="hover:bg-gray-50">
													<td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
													<td className="px-4 py-3 whitespace-nowrap">
														<div className="font-medium text-blue-600">{dept.name}</div>
														<div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
															{dept.description || 'Tavsif mavjud emas'}
														</div>
													</td>
													<td className="px-4 py-3 whitespace-nowrap">
														{dept.head ? (
															<div className="flex items-center">
																<div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
																	{dept.head.photo ? (
																		<img
																			className="h-10 w-10 rounded-full object-cover"
																			src={`${import.meta.env.VITE_BASE_URL}/uploads/${dept.head.photo}`}
																			alt={dept.head.fullName}
																		/>
																	) : (
																		<div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
																			{dept.head.fullName.charAt(0)}
																		</div>
																	)}
																</div>
																<div className="ml-3">
																	<div className="text-sm text-indigo-500 font-medium">{dept.head.fullName}</div>
																	<div className="text-xs text-gray-500">{dept.head.position}</div>
																</div>
															</div>
														) : (
															<span className="text-sm text-gray-500">Tayinlanmagan</span>
														)}
													</td>
													<td className="px-4 py-3 whitespace-nowrap text-sm">
														<button
															onClick={() => handleEdit(dept)}
															className="text-blue-600 hover:text-blue-800"
														>
															<FiEdit size={18} />
														</button>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</div>
					) : (
						<div className="mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
							<div className="mb-8">
								<h2 className="text-2xl font-bold text-gray-800">
									{editingId ? "Bo'limni tahrirlash" : "Yangi bo'lim qo'shish"}
								</h2>
								<p className="text-gray-500 mt-1">
									{editingId ? "Bo'lim ma'lumotlarini yangilang" : "Yangi bo'lim uchun ma'lumotlarni kiriting"}
								</p>
							</div>

							<form onSubmit={handleSubmit} className="space-y-6">
								{/* Department Name */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Bo'lim nomi <span className="text-red-500">*</span>
									</label>
									<div className="relative">
										<input
											type="text"
											value={name}
											onChange={(e) => setName(e.target.value)}
											placeholder="Masalan: IT bo'limi"
											className="w-full px-4 py-3 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
											required
										/>
										<div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
											<svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
											</svg>
										</div>
									</div>
								</div>

								{/* Department Head */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Bo'lim boshlig'i
									</label>
									<select
										onChange={(e) => setHead(users.find(u => u._id === e.target.value))}
										value={head?._id || ''}
										className="w-full px-4 py-3 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
									>
										<option value="">Boshliqni tanlang</option>
										{users.map(user => (
											<option key={user._id} value={user._id} className="flex items-center">
												{user.fullName} ({user.position})
											</option>
										))}
									</select>
									{head && (
										<div className="mt-2 flex items-center text-sm text-gray-600">
											<span className="inline-block h-2 w-2 rounded-full bg-green-400 mr-2"></span>
											{head.fullName} ({head.position})
										</div>
									)}
								</div>

								{/* Description */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Tavsif
									</label>
									<textarea
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										placeholder="Bo'lim vazifalari va maqsadlari..."
										rows={4}
										className="w-full px-4 text-black py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
									/>
									<p className="mt-1 text-xs text-gray-500">
										Ixtiyoriy - maksimal 255 ta belgi
									</p>
								</div>

								{/* Form Actions */}
								<div className="flex justify-end gap-3 pt-4">
									<button
										type="button"
										onClick={() => {
											resetForm()
											setActiveTab('list')
										}}
										className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
									>
										Bekor qilish
									</button>
									<button
										type="submit"
										disabled={isLoading}
										className={`px-6 py-2.5 rounded-lg font-medium text-white shadow-sm hover:shadow-md transition-all ${isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
											}`}
									>
										{isLoading ? (
											<span className="flex items-center justify-center">
												<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
													<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
													<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
												</svg>
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
			</div>
		</div>
	)
}

export default Department