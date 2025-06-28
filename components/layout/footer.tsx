export function Footer() {
  return (
    <footer className="bg-white border-t py-6 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-center md:text-left">
            <p className="text-sm text-gray-600 mb-2">
              © 2025 THERA-CURE Advanced Physiotherapy Clinic. All rights
              reserved.
            </p>
            <p className="text-xs text-gray-500">
              Powered by{" "}
              <a
                href="https://golicit.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-200"
              >
                Golicit
              </a>{" "}
            </p>
          </div>
          <div className="flex flex-wrap justify-center md:justify-end space-x-6">
            <a
              href="#"
              className="text-sm text-gray-600 hover:text-indigo-600 transition-colors duration-200"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-sm text-gray-600 hover:text-indigo-600 transition-colors duration-200"
            >
              Help Center
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
