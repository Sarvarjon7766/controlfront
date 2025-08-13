import { BsSignpost2Fill } from "react-icons/bs"
import { FaBuilding, FaClipboardList, FaTachometerAlt, FaUsers } from 'react-icons/fa'
import { FiLogOut } from 'react-icons/fi'
import { Link, useNavigate } from 'react-router-dom'

const AdminSitebar = () => {
	const navigate = useNavigate()
	const handleLogout = () => {
		navigate('/logout')
	}

	return (
		<aside className="w-64 h-screen bg-blue-800 text-white p-5 border-r border-gray-200 flex flex-col">
			<div className="mb-8">
				<h2 className="text-2xl font-bold text-white flex items-center">
					<span className="p-2 rounded-lg mr-3">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" stroke="#ffffff" strokeWidth="2" />
							<path d="M8 12h8m-8 4h8m-8-8h8" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
						</svg>
					</span>
					Work Control
				</h2>
				<p className="text-xs font-medium text-blue-200 mt-1 mr-12">Platformasi</p>
			</div>

			<nav className="flex-1 space-y-2">
				<Link
					to="/admin"
					className="flex items-center p-3 rounded-lg hover:bg-blue-700 hover:text-white transition-colors group"
				>
					<FaTachometerAlt className="text-blue-400 mr-3 group-hover:text-white" />
					<span className="font-medium">Bosh Sahifa</span>
				</Link>
				<Link
					to="/admin/departament"
					className="flex items-center p-3 rounded-lg hover:bg-blue-700 hover:text-white transition-colors group"
				>
					<FaUsers className="text-blue-400 mr-3 group-hover:text-white" />
					<span className="font-medium">Bo'limlar</span>
				</Link>
				<Link
					to="/admin/users"
					className="flex items-center p-3 rounded-lg hover:bg-blue-700 hover:text-white transition-colors group"
				>
					<FaBuilding className="text-blue-400 mr-3 group-hover:text-white" />
					<span className="font-medium">Xodimlar</span>
				</Link>
				<Link
					to="/admin/post"
					className="flex items-center p-3 rounded-lg hover:bg-blue-700 hover:text-white transition-colors group"
				>
					<BsSignpost2Fill className="text-blue-400 mr-3 group-hover:text-white" />
					<span className="font-medium">Post</span>
				</Link>



				<Link
					to="/admin/attandance"
					className="flex items-center p-3 rounded-lg hover:bg-blue-700 hover:text-white transition-colors group"
				>
					<FaClipboardList className="text-blue-400 mr-3 group-hover:text-white" />
					<span className="font-medium">Nazorat</span>
				</Link>

				{/* <Link
					to="/admin/birthday"
					className="flex items-center p-3 rounded-lg hover:bg-blue-700 hover:text-white transition-colors group"
				>
					<FaBirthdayCake className="text-blue-400 mr-3 group-hover:text-white" />
					<span className="font-medium">Tug'ilgan kunlar</span>
				</Link> */}
			</nav>

			<div className="mt-auto">
				<button
					onClick={handleLogout}
					className="flex items-center w-full p-3 rounded-lg hover:bg-blue-700 hover:text-white transition-colors group"
				>
					<FiLogOut className="text-blue-400 mr-3 group-hover:text-white" />
					<span className="font-medium">Chiqish</span>
				</button>
			</div>
		</aside>
	)
}

export default AdminSitebar