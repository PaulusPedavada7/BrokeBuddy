import api from "../axios.jsx";

function DeleteExpense({ onClose, id }) {
  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const res = await api.delete(`/deletetransaction/${id}`);
      console.log(res.data.message);
      onClose(); // close modal after success
    } catch (error) {
      console.error(error?.response?.data?.detail || error.message);
    }
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg p-6 w-full max-w-md pointer-events-auto">
          <h2 className="text-xl font-semibold dark:text-white mb-2">
            Delete Transaction?
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            This action cannot be undone.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border dark:text-white dark:border-zinc-600 hover:bg-gray-100 dark:hover:bg-zinc-700"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-400"
              >
                Delete
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default DeleteExpense;
