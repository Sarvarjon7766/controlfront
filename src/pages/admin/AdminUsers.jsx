import axios from 'axios'
import { useEffect, useState } from 'react'
import { FaRegCommentDots } from 'react-icons/fa'
import { FiBriefcase, FiDownload, FiEdit, FiFilter, FiHash, FiKey, FiPhone, FiPlus, FiSearch, FiUpload, FiUser, FiX } from 'react-icons/fi'
import { MdFormatListNumbered } from "react-icons/md"
import { ToastContainer, toast } from 'react-toastify'
import * as XLSX from 'xlsx'

const AdminUsers = () => {
	const token = localStorage.getItem('token')
	const [departments, setDepartments] = useState([])
	const [selectedDepartment, setSelectedDepartment] = useState('all')
	const [users, setUsers] = useState([])
	const [filteredUsers, setFilteredUsers] = useState([])
	const [searchTerm, setSearchTerm] = useState('')
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [isEditMode, setIsEditMode] = useState(false)
	const [imagePreview, setImagePreview] = useState(null)
	const [imageFile, setImageFile] = useState(null)
	const [minlavel, setMinLavel] = useState(1)

	const [userData, setUserData] = useState({
		_id: '',
		fullName: '',
		position: '',
		department: '',
		username: '',
		password: '',
		hodimID: '',
		lavel: '',
		role: 'viewer',
		birthday: '',
		phone_personal: '',
		phone_work: '',
		isEdit: true
	})

	// API Calls
	const fetchLavel = async () => {
		try {
			const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/user/getLavel`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			if (res.data.success) {
				setMinLavel(res.data.lavel)
				if (!isEditMode) {
					setUserData(prev => ({ ...prev, lavel: res.data.lavel }))
				}
			}
		} catch (error) {
			toast.error('Tartib raqamni yuklashda xatolik')
		}
	}

	const fetchDepartments = async () => {
		try {
			const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/departament/getAll`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			if (res.data.success) {
				setDepartments(res.data.departments)
			}
		} catch (error) {
			toast.error('Boʻlimlarni yuklashda xatolik')
		}
	}

	const fetchUsers = async () => {
		try {
			const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/user/getAll`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			if (res.data.success) {
				const sortedUsers = [...res.data.users].sort((a, b) => a.lavel - b.lavel)
				setUsers(sortedUsers)
				setFilteredUsers(sortedUsers)
				console.log(sortedUsers)
			}
		} catch (error) {
			toast.error('Foydalanuvchilarni yuklashda xatolik')
		}
	}

	useEffect(() => {
		fetchDepartments()
		fetchUsers()
		fetchLavel()
	}, [])

	useEffect(() => {
		filterUsers()
	}, [selectedDepartment, searchTerm, users])

	// Helper Functions
	const filterUsers = () => {
		let result = [...users]
		if (selectedDepartment !== 'all') {
			result = result.filter(user =>
				user.department && user.department._id === selectedDepartment
			)
		}
		if (searchTerm) {
			const term = searchTerm.toLowerCase()
			result = result.filter(user =>
				user.fullName.toLowerCase().includes(term) ||
				user.position.toLowerCase().includes(term) ||
				user.username.toLowerCase().includes(term))
		}
		setFilteredUsers(result)
	}

	const handleInputChange = (e) => {
		const { name, value, type, checked } = e.target

		// For checkbox inputs, use the 'checked' property
		if (type === 'checkbox') {
			setUserData(prev => ({
				...prev,
				[name]: checked
			}))
		}
		// For number inputs, convert value to number
		else if (type === 'number') {
			setUserData(prev => ({
				...prev,
				[name]: value === '' ? '' : Number(value)
			}))
		}
		// For all other input types (text, tel, etc.)
		else {
			setUserData(prev => ({
				...prev,
				[name]: value
			}))
		}
	}

	const handleImageChange = (e) => {
		const file = e.target.files[0]
		if (file) {
			if (file.size > 2 * 1024 * 1024) {
				toast.warning('Rasm hajmi 2MB dan kichik boʻlishi kerak')
				return
			}
			setImageFile(file)
			const reader = new FileReader()
			reader.onloadend = () => {
				setImagePreview(reader.result)
			}
			reader.readAsDataURL(file)
		}
	}

	const removeImage = () => {
		setImagePreview(null)
		setImageFile(null)
	}

	const resetForm = () => {
		setUserData({
			_id: '',
			fullName: '',
			position: '',
			department: '',
			username: '',
			password: '',
			hodimID: '',
			lavel: minlavel || 1,
			role: 'viewer'
		})
		setImagePreview(null)
		setImageFile(null)
		setIsEditMode(false)
	}

	const openEditModal = (user) => {
		setUserData({
			_id: user._id,
			fullName: user.fullName,
			position: user.position,
			department: user.department?._id || '',
			username: user.username,
			password: '',
			hodimID: user.hodimID || '',
			lavel: user.lavel || '',
			birthday: user.birthday,
			phone_personal: user.phone_personal,
			phone_work: user.phone_work
		})

		if (user.photo) {
			setImagePreview(`${import.meta.env.VITE_BASE_URL}/uploads/${user.photo}`)
		} else {
			setImagePreview(null)
		}

		setImageFile(null)
		setIsEditMode(true)
		setIsModalOpen(true)
	}

	const handleSubmit = async (e) => {
		e.preventDefault()
		try {
			const formData = new FormData()
			formData.append('fullName', userData.fullName)
			formData.append('position', userData.position)
			formData.append('username', userData.username)
			formData.append('hodimID', userData.hodimID)
			formData.append('role', userData.role)
			formData.append('lavel', userData.lavel)
			formData.append('birthday', userData.birthday)
			formData.append('phone_personal', userData.phone_personal)
			formData.append('phone_work', userData.phone_work)

			if (userData.password) formData.append('password', userData.password)
			if (userData.department) formData.append('department', userData.department)
			if (imageFile) formData.append('image', imageFile)

			let res
			if (isEditMode) {
				res = await axios.put(
					`${import.meta.env.VITE_BASE_URL}/api/user/update/${userData._id}`,
					formData,
					{
						headers: {
							'Authorization': `Bearer ${token}`,
							'Content-Type': 'multipart/form-data'
						},
					}
				)
			} else {
				if (!userData.password) {
					toast.warning('Parolni kiriting!')
					return
				}
				res = await axios.post(
					`${import.meta.env.VITE_BASE_URL}/api/user/register`,
					formData,
					{
						headers: {
							'Authorization': `Bearer ${token}`,
							'Content-Type': 'multipart/form-data'
						},
					}
				)
			}

			if (res.data.success) {
				toast.success(isEditMode ? "Xodim maʼlumotlari yangilandi!" : "Yangi xodim qoʻshildi!")
				fetchUsers()
				setIsModalOpen(false)
				resetForm()
				fetchLavel()
			} else {
				toast.error(res.data.message || 'Xatolik yuz berdi')
			}
		} catch (error) {
			toast.error(error.response?.data?.message || 'Server xatosi')
		}
	}

	const getStatusClass = (status) => {
		switch (status) {
			case 'kelmagan': return 'bg-red-100 text-red-800'
			case 'tashqarida': return 'bg-yellow-100 text-yellow-800'
			case 'ishda': return 'bg-green-100 text-green-800'
			default: return 'bg-gray-100 text-gray-800'
		}
	}

	const getStatusText = (status) => {
		switch (status) {
			case 'kelmagan': return 'Kelmagan'
			case 'tashqarida': return 'Tashqarida'
			case 'ishda': return 'Ishda'
			default: return 'Nomaʼlum'
		}
	}

	const [exportLoading, setExportLoading] = useState(false)

	const exportUsersToExcel = async () => {
		setExportLoading(true)
		try {
			// Prepare the data for export
			const exportData = users.map((user, index) => ({
				'№': index + 1,
				'F.I.Sh': user.fullName,
				'Lavozim': user.position,
				'Boʻlim': user.department ? user.department.name : "Bo'limsiz",
				'Hodim ID': user.hodimID || 'Mavjud emas',
				'Foydalanuvchi nomi': user.username,
				'Roli': user.role || 'viewer',
				'Tugʻilgan sana': user.birthday ? new Date(user.birthday).toLocaleDateString('uz-UZ') : 'Mavjud emas',
				'Shaxsiy telefon': user.phone_personal || 'Mavjud emas',
				'Ish telefon': user.phone_work || 'Mavjud emas',
				'Holati': getStatusText(user.attendanceStatus || 'Nomaʼlum'),
				'Tartib raqam': user.lavel || '',
				'Yaratilgan sana': new Date(user.createdAt).toLocaleDateString('uz-UZ'),
				'Oxirgi tahrir': user.updatedAt ? new Date(user.updatedAt).toLocaleDateString('uz-UZ') : 'Mavjud emas'
			}))
			const wscols = [
				{ wch: 5 },   // №
				{ wch: 25 },  // F.I.Sh
				{ wch: 25 },  // Lavozim
				{ wch: 20 },  // Boʻlim
				{ wch: 15 },  // Hodim ID
				{ wch: 20 },  // Foydalanuvchi nomi
				{ wch: 15 },  // Roli
				{ wch: 15 },  // Tugʻilgan sana
				{ wch: 15 },  // Shaxsiy telefon
				{ wch: 15 },  // Ish telefon
				{ wch: 15 },  // Holati
				{ wch: 15 },  // Tartib raqam
				{ wch: 15 },  // Yaratilgan sana
				{ wch: 15 }   // Oxirgi tahrir
			]

			// Create worksheet and workbook
			const ws = XLSX.utils.json_to_sheet(exportData)
			ws['!cols'] = wscols

			const wb = XLSX.utils.book_new()
			XLSX.utils.book_append_sheet(wb, ws, "Xodimlar")

			// Generate file name with current date
			const fileName = `xodimlar_${new Date().toISOString().slice(0, 10)}.xlsx`

			// Export to Excel
			XLSX.writeFile(wb, fileName)
			toast.success("Excel fayliga yuklandi!")
		} catch (error) {
			toast.error("Export qilishda xatolik")
			console.error("Excel export error:", error)
		} finally {
			setExportLoading(false)
		}
	}

	return (
		<div className="p-4 md:p-6 bg-gray-50 min-h-screen">
			<ToastContainer position="top-right" autoClose={5000} />

			{/* Search and Filter Section */}
			<div className="bg-white rounded-xl shadow p-4 mb-6">
				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
					{/* Search Input - Full width on mobile, flex-1 on desktop */}
					<div className="relative w-full md:flex-1">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
							<FiSearch />
						</div>
						<input
							type="text"
							placeholder="Xodimlarni qidirish..."
							className="pl-10 pr-4 py-2.5 text-black w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>

					{/* Action Buttons - Stack on mobile, row on desktop */}
					<div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto">
						{/* Filter Dropdown - Always visible */}
						<div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg flex-shrink-0">
							<FiFilter className="text-gray-500" />
							<select
								className="bg-transparent text-gray-800 border-none focus:outline-none focus:ring-0 text-sm md:text-base"
								value={selectedDepartment}
								onChange={(e) => setSelectedDepartment(e.target.value)}
							>
								<option value="all">Barcha</option>
								{departments.map(dept => (
									<option key={dept._id} value={dept._id}>{dept.name}</option>
								))}
							</select>
						</div>

						{/* Excel Export Button - Icon only on small screens */}
						<button
							onClick={exportUsersToExcel}
							disabled={exportLoading}
							className={`p-2 sm:px-4 sm:py-2.5 rounded-lg flex items-center gap-1 sm:gap-2 transition-colors flex-shrink-0 ${exportLoading
								? 'bg-gray-400 cursor-not-allowed'
								: 'bg-green-600 hover:bg-green-700 text-white'
								}`}
							title="Excelga yuklash"
						>
							{exportLoading ? (
								<svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
									<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
							) : (
								<FiDownload size={18} />
							)}
							<span className="hidden sm:inline">
								{exportLoading ? 'Yuklanmoqda...' : 'Excelga yuklash'}
							</span>
						</button>

						{/* Add User Button - Icon only on small screens */}
						<button
							onClick={() => {
								resetForm()
								setIsModalOpen(true)
							}}
							className="bg-blue-600 hover:bg-blue-700 text-white p-2 sm:px-4 sm:py-2.5 rounded-lg flex items-center gap-1 sm:gap-2 transition-colors flex-shrink-0"
							title="Yangi xodim"
						>
							<FiPlus size={18} />
							<span className="hidden sm:inline">Yangi xodim</span>
						</button>
					</div>
				</div>
			</div>

			{/* Users Table */}
			<div className="bg-white rounded-xl shadow overflow-hidden">
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Xodim</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lavozim</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Boʻlim</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Holati</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amallar</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{filteredUsers.length > 0 ? (
								filteredUsers.map((user, index) => (
									<tr key={user._id} className="hover:bg-gray-50 transition-colors">
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{index + 1}
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="flex items-center">
												<div className="flex-shrink-0 h-10 w-10">
													{user.photo ? (
														<img
															className="h-10 w-10 rounded-full object-cover"
															src={`${import.meta.env.VITE_BASE_URL}/uploads/${user.photo}`}
															alt={user.fullName}
														/>
													) : (
														<div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
															{user.fullName.charAt(0)}
														</div>
													)}
												</div>
												<div className="ml-4">
													<div className="text-sm font-medium text-gray-900">{user.fullName}</div>
													<div className="text-sm text-gray-500">{user.username}</div>
												</div>
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm text-gray-900">{user.position}</div>
											<div className="text-sm text-gray-500">{user.hodimID}</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm text-gray-900">
												{user.department ? user.department.name : "Bo'limsiz"}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="flex items-center gap-2">
												<span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(user.attendanceStatus)}`}>
													{getStatusText(user.attendanceStatus)}
												</span>
												<button className="text-gray-400 hover:text-blue-500">
													<FaRegCommentDots size={14} />
												</button>
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
											<button
												onClick={() => openEditModal(user)}
												className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
											>
												<FiEdit size={18} />
											</button>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
										Hech qanday xodim topilmadi
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>

			{isModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div
						className="fixed inset-0 backdrop-blur-sm"
						onClick={() => {
							setIsModalOpen(false)
							resetForm()
						}}
					></div>

					<div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
						<div className="sticky top-0 bg-white z-10 p-6 border-b border-gray-200">
							<div className="flex justify-between items-center">
								<h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
									<FiUser className="text-blue-500" />
									{isEditMode ? "Xodimni tahrirlash" : "Yangi xodim qo'shish"}
								</h2>
								<button
									onClick={() => {
										setIsModalOpen(false)
										resetForm()
									}}
									className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
								>
									<FiX size={24} />
								</button>
							</div>
						</div>

						<div className="p-6">
							<form onSubmit={handleSubmit} className="space-y-6">
								<div className="flex flex-col md:flex-row gap-8">
									{/* Avatar Section */}
									<div className="flex-shrink-0 flex flex-col items-center w-full md:w-1/3">
										<div className="relative mb-4 w-40 h-40">
											{imagePreview ? (
												<div className="relative group">
													<img
														src={imagePreview}
														alt="Preview"
														className="h-full w-full rounded-full object-cover border-4 border-white shadow-lg"
													/>
													<button
														type="button"
														onClick={removeImage}
														className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-md"
													>
														<FiX size={16} />
													</button>
												</div>
											) : (
												<div className="h-full w-full rounded-full bg-gray-100 flex items-center justify-center shadow-inner">
													<FiUser size={60} className="text-gray-400" />
												</div>
											)}
										</div>
										<label className="cursor-pointer bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-sm w-full justify-center">
											<FiUpload size={18} /> Rasm yuklash
											<input
												type="file"
												accept="image/*"
												onChange={handleImageChange}
												className="hidden"
											/>
										</label>
										<p className="text-xs text-gray-500 mt-2 text-center">2MB gacha (JPG, PNG)</p>
									</div>

									{/* Form Fields */}
									<div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
										{/* Column 1 */}
										<div className="space-y-4">
											<div className="bg-gray-50 p-4 rounded-lg">
												<h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
													<FiUser className="text-blue-500" />
													Asosiy ma'lumotlar
												</h3>

												<div className="space-y-4">
													<div>
														<label className="block text-sm font-medium text-gray-700 mb-1.5">Ism Familiya*</label>
														<div className="relative">
															<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
																<FiUser size={18} />
															</div>
															<input
																type="text"
																name="fullName"
																value={userData.fullName}
																placeholder="To'liq ism sharifingiz"
																onChange={handleInputChange}
																className="w-full pl-10 pr-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
																required
															/>
														</div>
													</div>

													<div>
														<label className="block text-sm font-medium text-gray-700 mb-1.5">Lavozim*</label>
														<div className="relative">
															<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
																<FiBriefcase size={18} />
															</div>
															<input
																type="text"
																name="position"
																placeholder="Lavozimi"
																value={userData.position}
																onChange={handleInputChange}
																className="w-full pl-10 text-black pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
																required
															/>
														</div>
													</div>

													<div>
														<label className="block text-sm font-medium text-gray-700 mb-1.5">Hodim ID*</label>
														<div className="relative">
															<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
																<FiHash size={18} />
															</div>
															<input
																type="text"
																name="hodimID"
																placeholder="HodimID"
																value={userData.hodimID}
																onChange={handleInputChange}
																className="w-full pl-10 pr-4 text-black py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
																required
															/>
														</div>
													</div>

													{!isEditMode && (
														<div>
															<label className="block text-sm font-medium text-gray-700 mb-1.5">Tartib raqam*</label>
															<div className="relative">
																<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
																	<MdFormatListNumbered size={20} />
																</div>
																<input
																	type="number"
																	name="lavel"
																	placeholder={`${minlavel} dan boshlab`}
																	value={userData.lavel}
																	onChange={handleInputChange}
																	min={minlavel || 1}
																	className="w-full pl-10 pr-4 text-black py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
																	required
																/>
															</div>
															<p className="text-xs text-gray-500 mt-1">
																Eng kichik tartib raqami: {minlavel}
															</p>
														</div>
													)}
												</div>
											</div>

											<div className="bg-gray-50 p-4 rounded-lg">
												<h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
													<FiPhone className="text-blue-500" />
													Aloqa ma'lumotlari
												</h3>

												<div className="space-y-4">
													<div>
														<label className="block text-sm font-medium text-gray-700 mb-1.5">Shaxsiy telefon</label>
														<div className="relative">
															<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
																<FiPhone size={18} />
															</div>
															<input
																type="tel"
																name="phone_personal"
																placeholder="+998901234567"
																value={userData.phone_personal}
																onChange={handleInputChange}
																className="w-full pl-10 pr-4 text-black py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
															/>
														</div>
													</div>

													<div>
														<label className="block text-sm font-medium text-gray-700 mb-1.5">Ish telefon</label>
														<div className="relative">
															<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
																<FiPhone size={18} />
															</div>
															<input
																type="tel"
																name="phone_work"
																placeholder="Karotki yoki ish joyidagi"
																value={userData.phone_work}
																onChange={handleInputChange}
																className="w-full pl-10 pr-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
															/>
														</div>
													</div>

													<div>
														<label className="block text-sm font-medium text-gray-700 mb-1.5">Tug'ilgan sana</label>
														<input
															type="date"
															name="birthday"
															value={userData.birthday}
															onChange={handleInputChange}
															max={new Date().toISOString().split("T")[0]}
															className="w-full px-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
														/>
													</div>
												</div>
											</div>
										</div>

										{/* Column 2 */}
										<div className="space-y-4">
											<div className="bg-gray-50 p-4 rounded-lg">
												<h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
													<FiKey className="text-blue-500" />
													Kirish ma'lumotlari
												</h3>

												<div className="space-y-4">
													<div>
														<label className="block text-sm font-medium text-gray-700 mb-1.5">Foydalanuvchi nomi*</label>
														<div className="relative">
															<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
																<FiUser size={18} />
															</div>
															<input
																type="text"
																name="username"
																value={userData.username}
																placeholder="Foydalanuvchi nomi"
																onChange={handleInputChange}
																className="w-full pl-10 text-black pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
																required
															/>
														</div>
													</div>

													<div>
														<label className="block text-sm font-medium text-gray-700 mb-1.5">
															{isEditMode ? "Yangi parol" : "Parol*"}
														</label>
														<div className="relative">
															<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
																<FiKey size={18} />
															</div>
															<input
																type="password"
																name="password"
																value={userData.password}
																placeholder={isEditMode ? "O'zgartirmoqchi bo'lsangiz" : "Kamida 8 belgi"}
																onChange={handleInputChange}
																className="w-full pl-10 text-black pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
																required={!isEditMode}
																minLength={8}
															/>
														</div>
													</div>

													<div>
														<label className="block text-sm font-medium text-gray-700 mb-1.5">Bo'lim</label>
														<select
															name="department"
															value={userData.department}
															onChange={handleInputChange}
															className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
														>
															<option value="">Bo'limni tanlang</option>
															{departments.map(dept => (
																<option key={dept._id} value={dept._id}>{dept.name}</option>
															))}
														</select>
													</div>

													<div>
														<label className="block text-sm font-medium text-gray-700 mb-1.5">Rol*</label>
														<select
															name="role"
															value={userData.role}
															onChange={handleInputChange}
															className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
															required
														>
															<option value="viewer">User</option>
															<option value="admin">Admin</option>
															<option value="post">Post</option>
														</select>
													</div>

													<div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
														<label htmlFor="isEdit" className="flex items-center cursor-pointer">
															<span className="text-sm font-medium text-gray-700 mr-3">
																O'zgartirish ruxsati
															</span>
															<div className="relative">
																<input
																	type="checkbox"
																	id="isEdit"
																	name="isEdit"
																	checked={userData.isEdit}
																	onChange={handleInputChange}
																	className="sr-only"
																/>
																<div className={`block w-12 h-6 rounded-full ${userData.isEdit ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
																<div
																	className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${userData.isEdit ? "transform translate-x-6" : ""}`}
																></div>
															</div>
														</label>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>

								{/* Form Actions */}
								<div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
									<button
										type="button"
										onClick={() => {
											setIsModalOpen(false)
											resetForm()
										}}
										className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
									>
										Bekor qilish
									</button>
									<button
										type="submit"
										className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors font-medium shadow-sm"
									>
										{isEditMode ? "Saqlash" : "Qo'shish"}
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			)}
		</div >
	)
}

export default AdminUsers