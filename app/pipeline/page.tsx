import { redirect } from "next/navigation";

export default function PipelineRedirectPage() {
  redirect("/finanzen?tab=pipeline");
}
