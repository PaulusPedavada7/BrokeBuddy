import { useContext } from "react";
import Sidebar from "../layout/Sidebar";
import DeleteSection from "./DeleteSection";
import PasswordForm from "./PasswordForm";
import ProfileForm from "./ProfileForm";
import { UserContext } from "../../App";

export default function Account() {
  const { currentUser, setCurrentUser } = useContext(UserContext)

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-zinc-900">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-auto p-8 gap-6 max-w-4xl w-full mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Account
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Manage you personal information and security
          </p>
        </div>

        <ProfileForm currentUser={currentUser} setCurrentUser={setCurrentUser} />
        <PasswordForm />
        <DeleteSection />
      </div>
    </div>
  )
}