const Patients: Patient[] = [
  { id: 1, name: "Rohan Mondal", uid: "987523652" },
  { id: 2, name: "Priya Sharma", uid: "987523653" },
  { id: 3, name: "Amit Kumar", uid: "987523654" },
  { id: 4, name: "Sneha Das", uid: "987523655" },
  { id: 5, name: "Rahul Singh", uid: "987523656" },
  { id: 6, name: "Anjali Verma", uid: "987523657" },
  { id: 7, name: "Vikram Patel", uid: "987523658" },
  { id: 8, name: "Meera Joshi", uid: "987523659" },
  { id: 9, name: "Suresh Gupta", uid: "987523660" },
  { id: 10, name: "Neha Kapoor", uid: "987523661" },
]

export async function GET() {
    
  
    return Response.json(Patients);
  }
  

  export async function POST(req: Request) {
    const { name, age, condition, contact, email } = await req.json();
  }
  export async function PUT(req: Request) {
    const { id, name, age, condition, contact, email } = await req.json();
    return Response.json({ message: "Patient updated!" });
  }
  export async function DELETE(req: Request) {
    const { id } = await req.json();
    return Response.json({ message: "Patient deleted!" });
  }
    