# VanGo Delivery App

A comprehensive delivery management platform built with Next.js, Supabase, and modern web technologies.

## Features

- 🚚 **Delivery Management**: Request, track, and manage deliveries
- 👥 **Multi-User Support**: Customer and driver portals
- 💳 **Payment Integration**: Multiple payment methods (Mastercard, PayPal, EFT)
- 📱 **Real-time Tracking**: Live GPS tracking and notifications
- 🔐 **Authentication**: Secure user authentication with Supabase
- 📊 **Analytics**: Delivery history and performance metrics

## Tech Stack

- **Frontend**: Next.js 14, React 19, TypeScript
- **UI**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (Database, Auth, Real-time)
- **State Management**: React Context API
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd vango-delivery-app
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
   - Copy `.env.local` and update with your Supabase credentials
   - Get your Supabase URL and anon key from your Supabase dashboard

4. Set up the database:
   - Run the SQL scripts in the `scripts/` folder in your Supabase SQL editor
   - Or use the built-in script runner in the app

5. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Setup

The app requires several database tables. Run these scripts in order:

1. `001_create_tables.sql` - Creates all necessary tables
2. `002_seed_sample_data.sql` - Adds sample data for testing
3. `003_create_indexes_and_functions.sql` - Adds performance optimizations

## Project Structure

\`\`\`
├── app/                    # Next.js app router
├── components/            # React components
│   ├── sections/         # Page sections
│   └── ui/              # Reusable UI components
├── lib/                  # Utility functions
│   └── supabase/        # Supabase client configuration
├── scripts/             # Database scripts
└── public/              # Static assets
\`\`\`

## Key Components

- **Authentication**: Supabase-powered auth with email/password
- **Delivery Management**: Full CRUD operations for deliveries
- **Real-time Updates**: Live tracking and notifications
- **Payment Processing**: Integrated payment flow
- **Driver Portal**: Dedicated interface for drivers
- **Admin Features**: User management and analytics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
