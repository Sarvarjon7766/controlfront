import axios from 'axios'
import { useEffect, useState } from 'react'
import { FiBarChart2, FiCalendar, FiClock, FiDownload, FiX } from 'react-icons/fi'
import { PulseLoader } from 'react-spinners'
import { toast } from 'react-toastify'
import * as XLSX from 'xlsx'

const UserAttendanceModal = ({ userId, onClose }) => {
	const token = localStorage.getItem('token')
	const [loading, setLoading] = useState(true)
	const [user, setUser] = useState(null)
	const [attendanceHistory, setAttendanceHistory] = useState([])
	const [stats, setStats] = useState({
		totalDays: 0,
		presentDays: 0,
		absentDays: 0,
		averageHours: 0,
		lastMonthPresent: 0
	})

	// Fetch user details and attendance history
	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true)
				const [userRes, historyRes] = await Promise.all([
					axios.get(`${import.meta.env.VITE_BASE_URL}/api/user/getById/${userId}`, {
						headers: { Authorization: `Bearer ${token}` },
					}),
					axios.get(`${import.meta.env.VITE_BASE_URL}/api/user/attandance/${userId}`, {
						headers: { Authorization: `Bearer ${token}` },
					}),
				])

				if (userRes.data.success) {
					console.log(userRes.data)
					setUser(userRes.data.user)
				}

				if (historyRes.data.success) {
					const history = historyRes.data.attendanceHistory
					console.log(historyRes.data)
					setAttendanceHistory(history)
					calculateStats(history)
				}
			} catch (error) {
				toast.error("Ma'lumotlarni yuklashda xato yuz berdi")
				console.error('Error fetching data:', error)
			} finally {
				setLoading(false)
			}
		}

		if (userId) {
			fetchData()
		}
	}, [userId, token])

	// Calculate statistics
	const calculateStats = (history) => {
		const presentDays = history.filter(record =>
			record.status === 'ishda' || record.logs.some(log => log.checkin)
		).length

		const absentDays = history.filter(record =>
			record.status === 'kelmagan' || record.logs.length === 0
		).length

		const totalHours = history.reduce((sum, record) => {
			return sum + (record.hoursWorked || 0)
		}, 0)

		setStats({
			totalDays: history.length,
			presentDays,
			absentDays,
			averageHours: history.length > 0 ? (totalHours / presentDays).toFixed(1) : 0,
			lastMonthPresent: calculateLastMonthPresent(history)
		})
	}

	const calculateLastMonthPresent = (history) => {
		const oneMonthAgo = new Date()
		oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

		return history.filter(record => {
			const recordDate = new Date(record.date)
			return recordDate >= oneMonthAgo &&
				(record.status === 'ishda' || record.logs.some(log => log.checkin))
		}).length
	}

	// Format time
	const formatTime = (timeString) => {
		if (!timeString) return '--:--'
		const date = new Date(timeString)
		return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
	}

	const uzbekWeekdays = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan']
	const uzbekMonths = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']

	const formatDate = (dateString) => {
		const date = new Date(dateString)
		const day = date.getDate()
		const month = uzbekMonths[date.getMonth()]
		const weekday = uzbekWeekdays[date.getDay()]
		return `${day} ${month}, ${weekday}`
	}



	// Export to Excel
	const exportToExcel = () => {
		const data = attendanceHistory.flatMap(record => {
			if (record.logs.length > 0) {
				return record.logs.map(log => ({
					Sana: formatDate(log.date || record.date),
					Holati: log.checkout === false ? 'Ishda' : log.checkout === true ? 'Tashqarida' : 'Noma\'lum',
					Kelish: formatTime(log.checkInTime),
					Ketish: formatTime(log.checkOutTime) || '--:--',
					Izoh: log.comment || ''
				}))
			}
			return {
				Sana: formatDate(record.date),
				Holati: record.status === "ishda" ? 'Ishda' : record.status === 'tashqarida' ? 'Tashqarida' : 'Kelmadi',
				Kelish: '--:--',
				Ketish: '--:--',
				Izoh: 'Log mavjud emas'
			}
		})

		const worksheet = XLSX.utils.json_to_sheet(data)
		const workbook = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(workbook, worksheet, "Davomat tarixi")
		XLSX.writeFile(workbook, `${user?.fullName}_davomat.xlsx`)
	}

	if (!userId) return null

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto">
			<div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
				{/* Background overlay */}
				<div className="fixed inset-0 transition-opacity" aria-hidden="true">
					<div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
				</div>

				{/* Modal container */}
				<div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
					{loading && !user ? (
						<div className="flex justify-center items-center p-12">
							<PulseLoader color="#6366F1" size={15} />
						</div>
					) : (
						<>
							{/* Header */}
							<div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 py-4">
								<div className="flex items-center justify-between">
									<h3 className="text-lg font-medium text-white">
										{user?.fullName} - Davomat monitoringi
									</h3>
									<button
										onClick={onClose}
										className="text-indigo-200 hover:text-white focus:outline-none"
									>
										<FiX className="h-6 w-6" />
									</button>
								</div>
							</div>

							{/* User info */}
							<div className="px-6 py-4 bg-indigo-50">
								<div className="flex items-start space-x-4">
									{/* Avatar */}
									<div className="flex-shrink-0 h-16 w-16 rounded-full bg-gradient-to-tr from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-2xl shadow-md">
										{user?.photo ? (
											<img
												src={`${import.meta.env.VITE_BASE_URL}/uploads/${user.photo}`}
												alt={user.fullName}
												className="h-full w-full rounded-full object-cover"
											/>
										) : (
											user?.fullName?.charAt(0)?.toUpperCase()
										)}
									</div>

									{/* User details */}
									<div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
										<div className="bg-white p-3 rounded-lg shadow-sm">
											<h4 className="text-xs font-medium text-gray-500">Lavozim</h4>
											<p className="mt-1 text-sm font-medium text-gray-900">{user?.position || "—"}</p>
										</div>
										<div className="bg-white p-3 rounded-lg shadow-sm">
											<h4 className="text-xs font-medium text-gray-500">Holati</h4>
											<p className="mt-1">
												<span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${user?.attendanceStatus === "ishda" ? 'bg-emerald-100 text-emerald-800' :
													user?.attendanceStatus === 'tashqarida' ? 'bg-blue-100 text-blue-800' :
														'bg-rose-100 text-rose-800'
													}`}>
													{user?.attendanceStatus === 'ishda' ? 'Ishda' :
														user?.attendanceStatus === 'tashqarida' ? 'Tashqarida' : 'Kelmadi'}
												</span>
											</p>
										</div>
										<div className="bg-white p-3 rounded-lg shadow-sm">
											<h4 className="text-xs font-medium text-gray-500">Bo'lim</h4>
											<p className="mt-1 text-sm font-medium text-gray-900">{user?.department?.name || "—"}</p>
										</div>
										<div className="bg-white p-3 rounded-lg shadow-sm">
											<h4 className="text-xs font-medium text-gray-500">Telefon</h4>
											<p className="mt-1 text-sm font-medium text-gray-900">{user?.phone || "—"}</p>
										</div>
									</div>
								</div>
							</div>

							{/* Statistics */}
							<div className="px-6 py-4 bg-white border-b border-gray-200">
								<div className="flex items-center justify-between mb-3">
									<h4 className="text-sm font-medium text-gray-900 flex items-center">
										<FiBarChart2 className="mr-2 text-indigo-600" />
										Statistik ma'lumotlar
									</h4>
									<button
										onClick={exportToExcel}
										className="flex items-center text-sm text-indigo-600 hover:text-indigo-800"
									>
										<FiDownload className="mr-1" />
										Excelga yuklash
									</button>
								</div>

								<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
									<div className="bg-blue-50 p-3 rounded-lg">
										<div className="text-xs font-medium text-blue-800">Umumiy kirib-chiqish</div>
										<div className="text-2xl font-bold text-blue-900 mt-1">{stats.totalDays}</div>
										<div className="text-xs text-blue-600 mt-1">Jami kirish-chiqishlar</div>
									</div>
									<div className="bg-emerald-50 p-3 rounded-lg">
										<div className="text-xs font-medium text-emerald-800">Ish holatilari</div>
										<div className="text-2xl font-bold text-emerald-900 mt-1">{stats.presentDays}</div>
										{/* <div className="text-xs text-emerald-600 mt-1">{stats.totalDays > 0 ?
											`${Math.round((stats.presentDays / stats.totalDays) * 100)}% ishga kelgan` : '—'}</div> */}
									</div>
									<div className="bg-amber-50 p-3 rounded-lg">
										<div className="text-xs font-medium text-amber-800">O'rtacha ish vaqti</div>
										<div className="text-2xl font-bold text-amber-900 mt-1">{stats.averageHours}</div>
										{/* <div className="text-xs text-amber-600 mt-1">soat / kun</div> */}
									</div>
									<div className="bg-purple-50 p-3 rounded-lg">
										<div className="text-xs font-medium text-purple-800">Kundagi kirib chiqishlar</div>
										<div className="text-2xl font-bold text-purple-900 mt-1">{stats.lastMonthPresent}</div>
										{/* <div className="text-xs text-purple-600 mt-1">kun ishga kelgan</div> */}
									</div>
								</div>
							</div>

							{/* Attendance history */}
							<div className="px-6 py-4">
								<h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
									<FiCalendar className="mr-2 text-indigo-600" />
									Davomat tarixi
								</h4>

								{attendanceHistory.length === 0 ? (
									<div className="text-center py-8 bg-gray-50 rounded-lg">
										<p className="text-sm text-gray-500">Davomat tarixi mavjud emas</p>
									</div>
								) : (
									<div className="overflow-x-auto">
										<table className="min-w-full divide-y divide-gray-200">
											<thead className="bg-gray-50">
												<tr>
													<th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sana</th>
													<th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Holati</th>
													<th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
														<div className="flex items-center">
															<FiClock className="mr-1" /> Kelish
														</div>
													</th>
													<th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
														<div className="flex items-center">
															<FiClock className="mr-1" /> Ketish
														</div>
													</th>
													<th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Izoh</th>
												</tr>
											</thead>
											<tbody className="bg-white divide-y divide-gray-200">
												{attendanceHistory.map((record, index) =>
													record.logs.length > 0 ? (
														record.logs.map((log, idx) => (
															<tr key={`${index}-${idx}`} className="hover:bg-gray-50">
																<td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
																	{formatDate(log.date || record.date)}
																</td>
																<td className="px-4 py-3 whitespace-nowrap text-sm">
																	{log.checkin === true && log.checkout === undefined ? (
																		<span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">
																			Ishda
																		</span>
																	) : log.checkout === true && log.checkout === true ? (
																		<span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
																			Tashqarida
																		</span>
																	) : (
																		<span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
																			Noma'lum
																		</span>
																	)}
																</td>
																<td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
																	{formatTime(log.checkInTime)}
																</td>
																<td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
																	{formatTime(log.checkOutTime) || '--:--'}
																</td>
																<td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
																	{log.comment || '—'}
																</td>
															</tr>
														))
													) : (
														<tr key={index} className="hover:bg-gray-50">
															<td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
																{formatDate(record.date)}
															</td>
															<td className="px-4 py-3 whitespace-nowrap text-sm">
																<span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${record.status === 'ishda' ? 'bg-emerald-100 text-emerald-800' :
																	record.status === 'tashqarida' ? 'bg-blue-100 text-blue-800' :
																		'bg-rose-100 text-rose-800'
																	}`}>
																	{record.status === 'ishda' ? 'Ishda' :
																		record.status === 'tashqarida' ? 'Tashqarida' : 'Kelmadi'}
																</span>
															</td>
															<td colSpan={3} className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">
																Log mavjud emas
															</td>
														</tr>
													)
												)}
											</tbody>
										</table>
									</div>
								)}
							</div>

							{/* Footer */}
							<div className="bg-gray-50 px-6 py-3 flex justify-between items-center border-t border-gray-200">
								<div className="text-xs text-gray-500">
									Oxirgi yangilanish: {new Date().toLocaleDateString('uz-UZ')}
								</div>
								<button
									onClick={onClose}
									className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none"
								>
									Yopish
								</button>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	)
}

export default UserAttendanceModal