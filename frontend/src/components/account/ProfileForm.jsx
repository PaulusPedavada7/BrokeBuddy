import { useState } from "react";
import { UserIcon, CheckIcon } from "@heroicons/react/24/outline";
import api from "../../axios";

export default function ProfileForm({ currentUser, setCurrentUser }) {
  const [firstName, setFirstName] = useState(currentUser?.first_name ?? "");
  const [lastName, setLastName] = useState(currentUser?.last_name ?? "");
  const [email, setEmail] = useState(currentUser?.email ?? "");
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await api.patch("/updateprofile", {
      first_name: firstName,
      last_name: lastName,
      email,
    });
    setCurrentUser({ ...currentUser, first_name: firstName, last_name: lastName, email })
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 p-6">
      {/* Card Title */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10">
          <UserIcon className="w-5 h-5 text-blue-500 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Profile</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500">Update your name and email address</p>
        </div>
      </div>

      {/* Profile info form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* First and last name */}
        <div className="grid grid-cols-2 gap-4">
          {/* First name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">First name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              className="w-full rounded-xl border border-gray-200 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Last name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Last name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              className="w-full rounded-xl border border-gray-200 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Email</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Last name"
            className="w-full rounded-xl border border-gray-200 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
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