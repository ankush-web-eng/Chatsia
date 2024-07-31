import UsersColumn from "@/components/UsersColumn";

export default function Page() {
  return (
    <div className="flex">
      <div className="max-lg:hidden">
        <UsersColumn />
      </div>
    </div>
  )
}