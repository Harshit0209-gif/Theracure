export function Footer() {
  return (
    <footer className="bg-white border-t py-4 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-600">
              © 2024 THERA-CURE Advanced Physiotherapy Clinic. All rights reserved.
            </p>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-sm text-gray-600 hover:text-indigo-600">
              Terms of Service
            </a>
            <a href="#" className="text-sm text-gray-600 hover:text-indigo-600">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-gray-600 hover:text-indigo-600">
              Help Center
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
