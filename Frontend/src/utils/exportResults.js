import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Export results as PDF
export const exportToPDF = (electionData, resultsData) => {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('Election Results Report', 105, 20, { align: 'center' });

  // Election Info
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text(`Election: ${electionData.title}`, 20, 35);
  doc.text(`Start Date: ${new Date(electionData.startTime).toLocaleString()}`, 20, 42);
  doc.text(`End Date: ${new Date(electionData.endTime).toLocaleString()}`, 20, 49);
  doc.text(`Status: ${electionData.status}`, 20, 56);
  doc.text(`Total Votes: ${resultsData.totalVotes}`, 20, 63);
  doc.text(`Total Candidates: ${resultsData.candidates.length}`, 20, 70);

  // Leaderboard Table
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text('Leaderboard', 20, 85);

  const tableData = resultsData.candidates.map((candidate, index) => [
    index + 1,
    candidate.name,
    candidate.voteCount,
    `${candidate.percentage}%`
  ]);

  doc.autoTable({
    startY: 90,
    head: [['Rank', 'Candidate Name', 'Votes', 'Vote Share']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [102, 126, 234],
      textColor: 255,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 10,
      cellPadding: 5
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    }
  });

  // Winner highlight
  if (resultsData.candidates.length > 0) {
    const winner = resultsData.candidates[0];
    const finalY = doc.lastAutoTable.finalY + 15;
    
    doc.setFontSize(14);
    doc.setTextColor(0, 128, 0);
    doc.text(`🏆 Winner: ${winner.name}`, 20, finalY);
    doc.setFontSize(12);
    doc.text(`With ${winner.voteCount} votes (${winner.percentage}%)`, 20, finalY + 7);
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Generated on ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`,
      105,
      285,
      { align: 'center' }
    );
  }

  // Save PDF
  doc.save(`Election_Results_${electionData.id}_${Date.now()}.pdf`);
};

// Export results as CSV
export const exportToCSV = (electionData, resultsData) => {
  // CSV Header
  let csv = 'Election Results Report\n\n';
  csv += `Election Title,${electionData.title}\n`;
  csv += `Start Date,${new Date(electionData.startTime).toLocaleString()}\n`;
  csv += `End Date,${new Date(electionData.endTime).toLocaleString()}\n`;
  csv += `Status,${electionData.status}\n`;
  csv += `Total Votes,${resultsData.totalVotes}\n`;
  csv += `Total Candidates,${resultsData.candidates.length}\n\n`;

  // Leaderboard
  csv += 'Rank,Candidate Name,Votes,Vote Share (%)\n';
  resultsData.candidates.forEach((candidate, index) => {
    csv += `${index + 1},${candidate.name},${candidate.voteCount},${candidate.percentage}\n`;
  });

  // Winner
  if (resultsData.candidates.length > 0) {
    const winner = resultsData.candidates[0];
    csv += `\nWinner,${winner.name},${winner.voteCount},${winner.percentage}\n`;
  }

  // Footer
  csv += `\nGenerated on,${new Date().toLocaleString()}\n`;

  // Download CSV
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `Election_Results_${electionData.id}_${Date.now()}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export detailed results with voter data (Admin only)
export const exportDetailedResults = (electionData, resultsData, votesData) => {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.text('Detailed Election Results', 105, 20, { align: 'center' });

  // Election Info
  doc.setFontSize(12);
  doc.text(`Election: ${electionData.title}`, 20, 35);
  doc.text(`Total Votes: ${resultsData.totalVotes}`, 20, 42);

  // Detailed Votes Table
  doc.setFontSize(14);
  doc.text('Vote Details', 20, 55);

  const tableData = votesData.map((vote, index) => [
    index + 1,
    vote.candidateName,
    vote.voterAadhaar.substring(0, 8) + '****', // Masked Aadhaar
    new Date(vote.timestamp).toLocaleString()
  ]);

  doc.autoTable({
    startY: 60,
    head: [['#', 'Candidate', 'Voter ID (Masked)', 'Timestamp']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [102, 126, 234]
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    }
  });

  doc.save(`Detailed_Results_${electionData.id}_${Date.now()}.pdf`);
};

// Generate shareable link
export const generateShareLink = (electionId) => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/election/${electionId}`;
};

// Copy to clipboard
export const copyToClipboard = (text) => {
  return navigator.clipboard.writeText(text);
};

export default {
  exportToPDF,
  exportToCSV,
  exportDetailedResults,
  generateShareLink,
  copyToClipboard
};
