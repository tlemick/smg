import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-neutral-400 dark:bg-neutral-700 border-t border-neutral-100 dark:border-neutral-900/50 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Contact Us Column */}
          <div>
            <h3 className="text-neutral-900 dark:text-neutral-100 font-bold text-lg mb-4">
              Contact Us
            </h3>
            <div className="space-y-2 text-gray-900 dark:text-gray-100">
              <p className="font-semibold">The SIFMA Foundation</p>
              <p className="font-semibold">The Stock Market Game</p>
              <div className="mt-4 space-y-1">
                <p>140 Broadway, 35th Floor</p>
                <p>New York, NY 10271-0080</p>
                <p>212.313.1350</p>
                <p>
                  <Link 
                    href="#" 
                    className="text-gray-900 dark:text-gray-100 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors"
                  >
                    smg@sifma.org
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Links Column */}
          <div>
            <h3 className="text-neutral-900 dark:text-neutral-100 font-bold text-lg mb-4">
              Links
            </h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="#" 
                  className="text-gray-900 dark:text-gray-100 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors text-lg"
                >
                  Register
                </Link>
              </li>
              <li>
                <Link 
                  href="#" 
                  className="text-gray-900 dark:text-gray-100 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors text-lg"
                >
                  Teacher Support Center
                </Link>
              </li>
              <li>
                <Link 
                  href="#" 
                  className="text-gray-900 dark:text-gray-100 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors text-lg"
                >
                  InvestWrite
                </Link>
              </li>
              <li>
                <Link 
                  href="#" 
                  className="text-gray-900 dark:text-gray-100 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors text-lg"
                >
                  Invest It Forward
                </Link>
              </li>
              <li>
                <Link 
                  href="#" 
                  className="text-gray-900 dark:text-gray-100 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors text-lg"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Right Column - Additional Links */}
          <div>
            <ul className="space-y-3 md:mt-12">
              <li>
                <Link 
                  href="#" 
                  className="text-gray-900 dark:text-gray-100 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors text-lg"
                >
                  Our Impact
                </Link>
              </li>
              <li>
                <Link 
                  href="#" 
                  className="text-gray-900 dark:text-gray-100 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors text-lg"
                >
                  Our Supporters
                </Link>
              </li>
              <li>
                <Link 
                  href="#" 
                  className="text-gray-900 dark:text-gray-100 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors text-lg"
                >
                  Donate
                </Link>
              </li>
              <li>
                <Link 
                  href="#" 
                  className="text-gray-900 dark:text-gray-100 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors text-lg"
                >
                  Volunteer
                </Link>
              </li>
              <li>
                <Link 
                  href="#" 
                  className="text-gray-900 dark:text-gray-100 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors text-lg"
                >
                  Code of Conduct
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

