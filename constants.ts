
export const COMMON_ROLES = [
  "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer", "DevOps Engineer",
  "Product Manager", "Project Manager", "Product Designer", "UI/UX Designer", "Data Scientist",
  "Data Analyst", "Business Analyst", "Marketing Manager", "Sales Representative", "Customer Success Manager",
  "HR Manager", "Recruiter", "Financial Analyst", "Accountant", "Operations Manager",
  "Nurse", "Medical Assistant", "Pharmacist", "Teacher", "Professor", "Graphic Designer",
  "Content Writer", "Copywriter", "Social Media Manager", "SEO Specialist"
];

export const COMMON_SKILLS = [
  "React", "JavaScript", "TypeScript", "Python", "Java", "AWS", "Docker", "Git", "Figma", "UI/UX Design", "SQL", "Cybersecurity",
  "Investment Banking", "Corporate Finance", "Accounting", "QuickBooks", "Risk Management", "Asset Management",
  "Nursing", "Patient Care", "Clinical Research", "Medical Coding", "Pharmacy",
  "SEO", "Social Media Marketing", "Content Strategy", "Salesforce", "Google Analytics", "Digital Marketing",
  "Customer Service", "Merchandising", "Event Planning", "Hotel Management",
  "Project Management", "Operations Management", "Strategic Thinking", "Agile Methodology", "Public Speaking", "Bilingual",
  "C++", "C#", "Go", "Rust", "Machine Learning", "Data Science", "Kubernetes", "Terraform", "Azure", "GCP"
];

export const CITIES_BY_COUNTRY: Record<string, string[]> = {
  "United States": ["New York", "San Francisco", "Austin", "Seattle", "Los Angeles", "Chicago", "Boston", "Miami", "Denver", "Washington D.C."],
  "United Kingdom": ["London", "Manchester", "Birmingham", "Edinburgh", "Glasgow", "Liverpool", "Leeds", "Bristol"],
  "Canada": ["Toronto", "Vancouver", "Montreal", "Ottawa", "Calgary", "Edmonton"],
  "Germany": ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne", "Stuttgart"],
  "France": ["Paris", "Lyon", "Marseille", "Toulouse", "Bordeaux", "Nice"],
  "India": ["Mumbai", "Bangalore", "Delhi", "Hyderabad", "Chennai", "Pune", "Kolkata"],
  "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Canberra"],
  "Japan": ["Tokyo", "Osaka", "Kyoto", "Yokohama", "Nagoya", "Sapporo"],
  "Brazil": ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza"],
  "China": ["Shanghai", "Beijing", "Shenzhen", "Guangzhou", "Chengdu", "Hangzhou"],
  "Singapore": ["Singapore"],
  "United Arab Emirates": ["Dubai", "Abu Dhabi", "Sharjah", "Ajman"],
  "Netherlands": ["Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven"],
  "Sweden": ["Stockholm", "Gothenburg", "Malmö", "Uppsala"],
  "Switzerland": ["Zurich", "Geneva", "Basel", "Lausanne", "Bern"],
  "Spain": ["Madrid", "Barcelona", "Valencia", "Seville", "Bilbao"],
  "Italy": ["Rome", "Milan", "Naples", "Turin", "Florence", "Venice"],
  "South Korea": ["Seoul", "Busan", "Incheon", "Daegu", "Daejeon"],
  "Uzbekistan": ["Tashkent", "Samarkand", "Bukhara", "Namangan", "Andijan", "Nukus", "Fergana", "Urgench", "Kokand"],
  "Kazakhstan": ["Almaty", "Astana", "Shymkent", "Karaganda"],
  "Russia": ["Moscow", "Saint Petersburg", "Novosibirsk", "Yekaterinburg", "Kazan"]
};

export const COUNTRIES = Object.keys(CITIES_BY_COUNTRY).sort();

export const CITIES = Object.values(CITIES_BY_COUNTRY).flat().sort();

export const WORK_MODES = ["On-site", "Remote", "Hybrid", "Shift / Rotational"];

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const YEARS = Array.from({ length: 50 }, (_, i) => (new Date().getFullYear() - i).toString());
