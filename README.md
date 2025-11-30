# Intern Hours Tracker

**Intern Hours Tracker** is a streamlined web application designed to efficiently track and manage On-the-Job Training (OJT) hours. Built with modern technologies, it automatically calculates progress and provides a seamless experience across desktop and mobile devices.

## ✨ Features

- ✅ **Automated Hour Calculation** – Accurately computes rendered hours with real-time updates
- 📊 **Flexible Time Entry** – Supports full-day, half-day, and evening shift schedules
- 📈 **Progress Dashboard** – Visual representation of completed hours versus required hours
- 🕒 **Comprehensive Time Logging** – Track morning, afternoon, and evening work periods
- 🔒 **Secure Authentication** – Google OAuth integration for safe and convenient access
- 📱 **Responsive Design** – Optimized for seamless use on desktop, tablet, and mobile devices
- 🌙 **Dark Mode Support** – Toggle between light and dark themes for comfortable viewing

## 🎯 Purpose

Manual OJT hour tracking is prone to errors, time-consuming, and difficult to manage. This application addresses these challenges by:

- **Eliminating calculation errors** through automated hour computation
- **Promoting accountability** with accurate, timestamped records
- **Streamlining reporting** for both interns and supervisors
- **Reducing administrative overhead** by digitizing the tracking process
- **Providing transparency** with clear progress visualization

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.2.4 with React
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Hooks

### Backend & Database
- **Backend Service**: Supabase
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma

### Authentication
- **Provider**: Supabase Auth with Google OAuth

### Deployment & Infrastructure
- **Hosting**: Vercel
- **Environment**: Node.js

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- A Google Cloud Console project (for OAuth)

### Installation

1. **Clone the repository**
```bash
   git clone https://github.com/Jundel-Malazarte/intern-hours-tracker.git
   cd intern-hours-tracker
```

2. **Install dependencies**
```bash
   npm install
```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   DATABASE_URL=your_database_url
   DIRECT_URL=your_direct_url
```

4. **Run database migrations**
```bash
   npx prisma generate
   npx prisma migrate dev
```

5. **Start the development server**
```bash
   npm run dev
```

6. **Open your browser**
   
   Navigate to `http://localhost:3000`

## 📖 Usage

1. **Sign In** – Authenticate using your Google account
2. **Add Time Entries** – Record your work hours for morning, afternoon, or evening shifts
3. **Track Progress** – View your total logged hours and completion percentage
4. **Edit/Delete Entries** – Manage your time records as needed
5. **Monitor Goals** – Set and track your required internship hours

## 🔐 Security

- End-to-end encryption for data transmission
- Secure OAuth 2.0 authentication via Google
- Row-level security policies in Supabase
- Environment-based configuration for sensitive credentials

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

**Jundel Malazarte**

- GitHub: [@Jundel-Malazarte](https://github.com/Jundel-Malazarte)
- Project Link: [https://github.com/Jundel-Malazarte/intern-hours-tracker](https://github.com/Jundel-Malazarte/intern-hours-tracker)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Backend powered by [Supabase](https://supabase.com/)
- Deployed on [Vercel](https://vercel.com/)

---

**Live Demo**: [https://hours-tracker-intern.vercel.app](https://hours-tracker-intern.vercel.app)

*Track your internship hours with confidence and ease.*