import { LockClosedIcon } from "@heroicons/react/24/outline"

export default function PasswordForm() {
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

            {/* Content here */}
        </div>
    )
}