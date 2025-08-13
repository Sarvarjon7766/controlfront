import axios from 'axios'
import { useEffect, useState } from 'react'
import { FiBriefcase, FiEdit, FiFilter, FiKey, FiPlus, FiSearch, FiUpload, FiUser, FiX } from 'react-icons/fi'
import { ToastContainer, toast } from 'react-toastify'

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

	const [userData, setUserData] = useState({
		_id: '',
		fullName: '',
		position: '',
		department: '',
		username: '',
		password: '',
		hodimID: '',
		role: 'viewer'
	})

	const fetchDepartments = async () => {
		try {
			const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/departament/getAll`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			if (res.data.success) {
				setDepartments(res.data.departments)
			}
		} catch (error) {
			console.error('Xatolik boʻlimlarni yuklashda:', error)
			toast.error('Boʻlimlarni yuklashda xatolik yuz berdi')
		}
	}

	const fetchUsers = async () => {
		try {
			const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/user/getAll`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			if (res.data.success) {
				setUsers(res.data.users)
				setFilteredUsers(res.data.users)
			}
		} catch (error) {
			console.error('Xatolik foydalanuvchilarni yuklashda:', error)
			toast.error('Foydalanuvchilarni yuklashda xatolik yuz berdi')
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
		const { name, value } = e.target
		setUserData(prev => ({
			...prev,
			[name]: value
		}))
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
			password: '', // Parolni xavfsizlik uchun ko'rsatmaymiz
			hodimID: user.hodimID || '',
			role: user.role || 'viewer'
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
			formData.append('department', userData.department)
			formData.append('username', userData.username)
			formData.append('hodimID', userData.hodimID)
			formData.append('role', userData.role)

			// Faqat yangi parol kiritilgan bo'lsa yuboramiz
			if (userData.password) {
				formData.append('password', userData.password)
			}

			if (imageFile) {
				formData.append('image', imageFile)
			}

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
				console.log(res.data)
			} else {
				// Parol majburiy
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
			} else {
				toast.error(res.data.message || 'Xatolik yuz berdi')
			}
		} catch (error) {
			console.error('Xatolik:', error)
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

			<div className="bg-white rounded-lg shadow p-4 mb-6">
				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
					<div className="relative flex-1">
						<FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
						<input
							type="text"
							placeholder="Xodimlarni qidirish..."
							className="pl-10 pr-4 text-black py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>

					<div className="flex items-center gap-2">
						<FiFilter className="text-gray-500" />
						<select
							className="border rounded-lg text-black px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							value={selectedDepartment}
							onChange={(e) => setSelectedDepartment(e.target.value)}
						>
							<option value="all">Barcha boʻlimlar</option>
							{departments.map(dept => (
								<option key={dept._id} value={dept._id}>{dept.name}</option>
							))}
						</select>
					</div>

					<button
						onClick={() => {
							resetForm()
							setIsModalOpen(true)
						}}
						className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
					>
						<FiPlus /> Yangi xodim
					</button>
				</div>
			</div>

			<div className="bg-white rounded-lg shadow overflow-hidden">
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rasm</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ism Familiya</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lavozim</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Boʻlim</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Foydalanuvchi nomi</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Holati</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amallar</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{filteredUsers.length > 0 ? (
								filteredUsers.map(user => (
									<tr key={user._id} className="hover:bg-gray-50">
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="flex-shrink-0 h-10 w-10">
												{user.photo ? (
													<img
														className="h-10 w-10 rounded-full object-cover"
														src={`${import.meta.env.VITE_BASE_URL}/uploads/${user.photo}`}
														alt={user.fullName}
													/>
												) : (
													<div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
														{user.fullName.charAt(0)}
													</div>
												)}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm font-medium text-gray-900">{user.fullName}</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm text-gray-500">{user.position}</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm text-gray-500">
												{user.department ? user.department.name : "Bo'limga biriktirilmagan"}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm text-gray-500">{user.username}</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full shadow-sm ${getStatusClass(user.attendanceStatus)}`}>
												{getStatusText(user.attendanceStatus)}
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
											<button
												onClick={() => openEditModal(user)}
												className="text-blue-600 hover:text-blue-900"
												title="Tahrirlash"
											>
												<FiEdit />
											</button>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
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

					<div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
						<div className="p-6">
							<div className="flex justify-between items-center mb-6 pb-4 border-b">
								<h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
									<FiUser className="text-blue-600" />
									{isEditMode ? "Xodimni tahrirlash" : "Yangi xodim qoʻshish"}
								</h2>
								<button
									onClick={() => {
										setIsModalOpen(false)
										resetForm()
									}}
									className="text-gray-500 hover:text-gray-700 transition-colors"
								>
									<FiX size={24} />
								</button>
							</div>

							<form onSubmit={handleSubmit}>
								<div className="mb-6 flex flex-col items-center">
									<div className="relative mb-3">
										{imagePreview ? (
											<div className="relative group">
												<img
													src={imagePreview}
													alt="Preview"
													className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-lg"
												/>
												<button
													type="button"
													onClick={removeImage}
													className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
												>
													<FiX size={16} />
												</button>
											</div>
										) : (
											<div className="h-32 w-32 rounded-full bg-gray-100 flex items-center justify-center shadow-inner">
												<FiUser size={48} className="text-gray-400" />
											</div>
										)}
									</div>
									<label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
										<FiUpload /> Rasm yuklash
										<input
											type="file"
											accept="image/*"
											onChange={handleImageChange}
											className="hidden"
										/>
									</label>
									<p className="text-xs text-gray-500 mt-2">2MB gacha boʻlgan rasm (JPG, PNG)</p>
								</div>

								<div className="space-y-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Ism Familiya</label>
										<div className="relative">
											<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
												<FiUser />
											</div>
											<input
												type="text"
												name="fullName"
												value={userData.fullName}
												placeholder='Ism Familiya'
												onChange={handleInputChange}
												className="w-full pl-10 pr-4 py-2 text-black border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
												required
											/>
										</div>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Lavozim</label>
										<div className="relative">
											<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
												<FiBriefcase />
											</div>
											<input
												type="text"
												name="position"
												placeholder='Lavozim'
												value={userData.position}
												onChange={handleInputChange}
												className="w-full pl-10 pr-4 py-2 text-black border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
												required
											/>
										</div>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Hodim ID</label>
										<div className="relative">
											<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
												<FiBriefcase />
											</div>
											<input
												type="text"
												name="hodimID"
												placeholder='Hodim ID'
												value={userData.hodimID}
												onChange={handleInputChange}
												className="w-full pl-10 pr-4 py-2 text-black border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
												required
											/>
										</div>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Boʻlim</label>
										<select
											name="department"
											value={userData.department}
											onChange={handleInputChange}
											className="w-full px-4 py-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
											required
										>
											<option value="">Boʻlimni tanlang</option>
											{departments.map(dept => (
												<option key={dept._id} value={dept._id}>{dept.name}</option>
											))}
										</select>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Foydalanuvchi nomi</label>
										<input
											type="text"
											name="username"
											value={userData.username}
											placeholder='Foydalanuvchi nomi'
											onChange={handleInputChange}
											className="w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
											required
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											{isEditMode ? "Yangi parol (agar o'zgartirmoqchi bo'lsangiz)" : "Parol"}
										</label>
										<div className="relative">
											<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
												<FiKey />
											</div>
											<input
												type="password"
												name="password"
												value={userData.password}
												placeholder={isEditMode ? "Yangi parol..." : "Parol"}
												onChange={handleInputChange}
												className="w-full pl-10 pr-4 py-2 text-black border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
												required={!isEditMode}
											/>
										</div>
									</div>

									{isEditMode && (
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
											<select
												name="role"
												value={userData.role}
												onChange={handleInputChange}
												className="w-full px-4 py-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
												required
											>
												<option value="viewer">Viewer</option>
												<option value="admin">Admin</option>
											</select>
										</div>
									)}
								</div>

								<div className="flex justify-end gap-3 mt-6 pt-4 border-t">
									<button
										type="button"
										onClick={() => {
											setIsModalOpen(false)
											resetForm()
										}}
										className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
									>
										Bekor qilish
									</button>
									<button
										type="submit"
										className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
									>
										{isEditMode ? "Saqlash" : "Qoʻshish"}
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default AdminUsers