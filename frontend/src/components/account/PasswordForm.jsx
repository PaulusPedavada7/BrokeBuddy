import { useState } from "react"
import { LockClosedIcon, EyeIcon, EyeSlashIcon, CheckIcon } from "@heroicons/react/24/outline"
import api from "../../axios";

export default function PasswordForm() {
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPass !== confirmPass) {
      console.error("Retype the new password correctly to confirm")
      return;
    }

    await api.patch("/updatepassword", {
      current_password: currentPass,
      new_password: newPass,
    });

    setCurrentPass("");
    setNewPass("");
    setConfirmPass("");
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false)
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 p-6">
      {/* Card Title */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10">
          <LockClosedIcon className="w-5 h-5 text-blue-500 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Password</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500">Change your password</p>
        </div>
      </div>

      {/* Password form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Current password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Current password</label>
          <div className="relative">
            <input
              type={showCurrent ? "text": "password"}
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-xl border border-gray-200 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            {/* Show password toggle */}
            <button
              type="button"
              onClick={() => setShowCurrent(prev => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:dark:text-gray-300 transition-colors cursor-pointer"
            >
              {showCurrent ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* New password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">New password</label>
          <div className="relative">
            <input
              type={showNew ? "text": "password"}
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-xl border border-gray-200 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            {/* Show password toggle */}
            <button
              type="button"
              onClick={() => setShowNew(prev => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:dark:text-gray-300 transition-colors cursor-pointer"
            >
              {showNew ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Confirm password</label>
          <div className="relative">
            <input
              type={showConfirm ? "text": "password"}
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-xl border border-gray-200 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            {/* Show password toggle */}
            <button
              type="button"
              onClick={() => setShowConfirm(prev => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:dark:text-gray-300 transition-colors cursor-pointer"
            >
              {showConfirm ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
          >
            {saved && <CheckIcon className="w-4 h-4" />}
            {saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  )
}