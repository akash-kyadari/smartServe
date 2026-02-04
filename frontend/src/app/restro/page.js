import { redirect } from "next/navigation";

export default function RestroRedirect() {
  // Server-side redirect to new /business route
  redirect('/business');
}
