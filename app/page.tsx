import { VeloQuestApp } from "@/components/VeloQuestApp";
import { InstallProvider } from "@/components/InstallProvider";
import { PwaProvider } from "@/components/PwaProvider";

export default function Home() {
  return <InstallProvider><PwaProvider><VeloQuestApp /></PwaProvider></InstallProvider>;
}
