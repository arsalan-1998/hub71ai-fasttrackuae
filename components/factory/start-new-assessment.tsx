'use client';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { clearAssessment } from '@/lib/local-assessment';
export function StartNewAssessment({storageScope,variant='dashboard'}:{storageScope?:string|null;variant?:'dashboard'|'assessment'}) {
 const [error,setError]=useState('');
 return <AlertDialog onOpenChange={()=>setError('')}><AlertDialogTrigger asChild><button className={`start-new-assessment ${variant}`} type="button"><Trash2 size={15}/>Delete & start new</button></AlertDialogTrigger><AlertDialogContent className="panel reset-assessment-dialog"><AlertDialogTitle>Start a new assessment?</AlertDialogTitle><AlertDialogDescription>This removes the remembered company answers, financial inputs and unfinished draft from this browser. Scenarios you saved to your account remain available.</AlertDialogDescription>{error&&<p role="alert">{error}</p>}<AlertDialogFooter><AlertDialogCancel>Keep my assessment</AlertDialogCancel><AlertDialogAction onClick={event=>{if(storageScope&&!clearAssessment(storageScope)){event.preventDefault();setError('The browser copy could not be deleted. Please check your browser storage settings.');return;}window.location.assign('/get-started?fresh=1');}}>Delete browser copy & start new</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}
