import { ExclamationTriangleIcon } from "@heroicons/react/24/outline"

export default function PasswordForm() {
    return (
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-red-200 dark:border-red-400 p-6">
            {/* Card Title */}
            <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-50 dark:bg-red-500/10">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-500 dark:text-red-400" />
                </div>
                <div>
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Danger Zone</h2>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Irreversible actions</p>
                </div>
            </div>

            {/* Content here */}
        </div>
    )
}