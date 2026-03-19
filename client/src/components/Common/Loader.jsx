const Loader = ({ text = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-3"></div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{text}</p>
    </div>
  );
};

export default Loader;
