import { redirect } from 'next/navigation';

   // Panoramica rimossa: la home reindirizza al Negozio,
   // pagina iniziale dopo il login.
   export default function HomePage() {
     redirect('/negozio');
   }