// Contrôle public sans session, sans lire ni créer une copie ou une note.
for (const slug of ['teacher-course','teacher-correction','teacher-grade']) {
    const response=await fetch('https://aqbjykgppbyrzqxlzxuf.supabase.co/functions/v1/'+slug,{
        method:'POST',headers:{'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(15000)
    });
    console.log(slug+': '+response.status);
    if(response.status!==401)throw new Error('unauthenticated_request_not_rejected');
}
