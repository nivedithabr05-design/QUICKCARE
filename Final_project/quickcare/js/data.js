// ---- Static reference data ----

const DEPARTMENTS = [
  { name: "Cardiology", icon: "❤️", location: "Block B, Room 203" },
  { name: "Neurology", icon: "🧠", location: "Block A, Room 110" },
  { name: "Orthopedics", icon: "🦴", location: "Block C, Room 305" },
  { name: "Pediatrics", icon: "🧒", location: "Block B, Room 108" },
  { name: "Dermatology", icon: "🧴", location: "Block A, Room 214" },
  { name: "Oncology", icon: "🎗️", location: "Block D, Room 401" },
  { name: "Emergency", icon: "🚑", location: "Block A, Ground Floor" },
  { name: "General Medicine", icon: "🩺", location: "Block A, Room 101" }
];

const DOCTORS = [
  { name: "Dr. Ananya Sharma", dept: "Cardiology", qual: "MBBS, MD, DM", exp: "12 years experience", loc: "Block B · Room 203", available: true, photo: "https://i.pravatar.cc/300?img=5" },
  { name: "Dr. Rohan Mehta", dept: "Cardiology", qual: "MBBS, MD", exp: "8 years experience", loc: "Block B · Room 204", available: false, photo: "https://i.pravatar.cc/300?img=12" },
  { name: "Dr. Priya Nair", dept: "Cardiology", qual: "MBBS, MD", exp: "10 years experience", loc: "Block B · Room 205", available: true, photo: "https://i.pravatar.cc/300?img=32" },
  { name: "Dr. Kabir Singh", dept: "Neurology", qual: "MBBS, DM", exp: "14 years experience", loc: "Block A · Room 110", available: true, photo: "https://i.pravatar.cc/300?img=51" },
  { name: "Dr. Meera Iyer", dept: "Neurology", qual: "MBBS, MD", exp: "9 years experience", loc: "Block A · Room 111", available: false, photo: "https://i.pravatar.cc/300?img=45" },
  { name: "Dr. Arjun Rao", dept: "Orthopedics", qual: "MBBS, MS", exp: "11 years experience", loc: "Block C · Room 305", available: true, photo: "https://i.pravatar.cc/300?img=52" },
  { name: "Dr. Sneha Kapoor", dept: "Pediatrics", qual: "MBBS, MD", exp: "7 years experience", loc: "Block B · Room 108", available: true, photo: "https://i.pravatar.cc/300?img=47" },
  { name: "Dr. Vikram Joshi", dept: "Dermatology", qual: "MBBS, MD", exp: "6 years experience", loc: "Block A · Room 214", available: true, photo: "https://i.pravatar.cc/300?img=53" },
  { name: "Dr. Ishita Verma", dept: "Oncology", qual: "MBBS, DM", exp: "15 years experience", loc: "Block D · Room 401", available: false, photo: "https://i.pravatar.cc/300?img=44" },
  { name: "Dr. Farhan Ali", dept: "General Medicine", qual: "MBBS", exp: "5 years experience", loc: "Block A · Room 101", available: true, photo: "https://i.pravatar.cc/300?img=59" }
];

// Ambulance drivers on call, and quick emergency guidelines
const AMBULANCE_DRIVERS = [
  { name: "Suresh Kumar", vehicle: "Ambulance 1 (ICU)", phone: "9900011122" },
  { name: "Manjunath R", vehicle: "Ambulance 2 (Basic)", phone: "9900033344" },
  { name: "Lokesh N", vehicle: "Ambulance 3 (Basic)", phone: "9900055566" }
];

const EMERGENCY_GUIDELINES = [
  "Call the ambulance number directly for pickup — do not wait at reception.",
  "Keep the patient still; do not move a suspected spinal or head injury.",
  "Have the patient's ID/phone number ready for faster registration.",
  "Head straight to the Emergency Ward, Block A, Ground Floor, on arrival.",
  "For chest pain, breathing difficulty, or heavy bleeding, call an ambulance immediately rather than self-transporting."
];

// Default seed patients (used only the first time the app runs)
const SEED_PATIENTS = [
  { patientId: "P1004", name: "Riya Patel", age: 10, gender: "Female", phone: "9876543210", department: "Pediatrics" },
  { patientId: "P1007", name: "Aarav Singh", age: 6, gender: "Male", phone: "9876500001", department: "Pediatrics" },
  { patientId: "P1009", name: "Diya Nair", age: 8, gender: "Female", phone: "9876500002", department: "Pediatrics" },
  { patientId: "P1011", name: "Advik Rao", age: 5, gender: "Male", phone: "9876500003", department: "Pediatrics" }
];

const SEED_QUEUE = [
  { patientId: "P1004", status: "Waiting" },
  { patientId: "P1007", status: "Waiting" },
  { patientId: "P1009", status: "In Consultation" },
  { patientId: "P1011", status: "Admitted" }
];
