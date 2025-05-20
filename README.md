# Physio Dashboard

A comprehensive dashboard for physiotherapy clinic management, featuring role-based access control for administrators, receptionists, and content managers.

## Features

- 🔐 Role-based authentication
- 👥 Multiple user roles (Admin, Therapist, Receptionist, Content Manager)
- 📊 Dashboard analytics
- 📅 Appointment management
- 💰 Invoice tracking
- 📝 Blog content management
- 🎨 Modern UI with Tailwind CSS
- 📱 Responsive design

## Prerequisites

- Node.js (v18 or higher)
- Package Manager: npm (v9 or higher) or pnpm (v8 or higher)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Theracure-Dashboard
   ```

2. Install dependencies using either npm or pnpm:

   **Using npm:**
   ```bash
   # Remove pnpm-lock.yaml if it exists
   rm pnpm-lock.yaml
   
   # Install dependencies
   npm install
   ```

   **Using pnpm:**
   ```bash
   pnpm install
   ```

3. Create a `.env` file in the root directory:
   ```env
   # Add your environment variables here
   ```

## Development

Run the development server:

**Using npm:**
```bash
npm run dev
```

**Using pnpm:**
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

**Using npm:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

**Using pnpm:**
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── admin/             # Admin routes
│   ├── content/           # Content manager routes
│   ├── receptionist/      # Receptionist routes
│   └── login/             # Authentication
├── components/            # Reusable components
├── contexts/             # React contexts
├── hooks/                # Custom hooks
├── lib/                  # Utility functions
└── public/              # Static assets
```

## User Roles

1. **Admin**
   - Access to all features
   - User management
   - System settings

2. **Receptionist**
   - Appointment management
   - Patient records
   - Invoice handling

3. **Content Manager**
   - Blog management
   - Content updates
   - Notifications

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Radix UI
- npm/pnpm

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 