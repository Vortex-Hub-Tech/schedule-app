// Serviço de moderação automática de avaliações

// Lista de palavras e padrões inadequados
const inappropriateWords = [
  // Palavrões comuns em português
  'porra', 'caralho', 'puta', 'merda', 'bosta', 'cacete', 
  'cu', 'fdp', 'desgraça', 'inferno', 'droga',
  
  // Palavras ofensivas
  'idiota', 'burro', 'estúpido', 'imbecil', 'cretino',
  'retardado', 'otário', 'trouxa', 'babaca', 'escroto',
  
  // Termos discriminatórios (para detectar e bloquear)
  'racista', 'preconceito', 'discriminação',
  
  // Spam/fraude
  'golpe', 'fraude', 'roubo', 'ladrão', 'enganação'
];

// Padrões suspeitos (sem flag global para evitar problemas de estado)
const suspiciousPatterns = [
  // URLs e links (possível spam)
  /https?:\/\//i,
  /www\./i,
  
  // Números de telefone repetidos (possível spam)
  /(\d{10,})/,
  
  // Excesso de caracteres repetidos (ex: "muuuuuito")
  /(.)\1{5,}/,
  
  // Texto todo em maiúsculas (possível spam ou agressividade)
  /^[A-Z\s!?]{20,}$/
];

/**
 * Analisa o conteúdo de uma avaliação e determina se é apropriado
 * @param {string} comment - Comentário da avaliação
 * @param {number} rating - Nota da avaliação (1-5)
 * @returns {Object} Resultado da moderação
 */
function moderateContent(comment, rating) {
  const result = {
    approved: true,
    autoModerated: true,
    reason: null,
    severity: 'none' // none, low, medium, high
  };

  // Se não houver comentário, aprovar automaticamente
  if (!comment || comment.trim().length === 0) {
    return result;
  }

  const lowerComment = comment.toLowerCase();
  const issues = [];

  // 1. Verificar palavras inadequadas
  const foundInappropriateWords = inappropriateWords.filter(word => 
    lowerComment.includes(word.toLowerCase())
  );

  if (foundInappropriateWords.length > 0) {
    issues.push(`Palavras inadequadas detectadas: ${foundInappropriateWords.join(', ')}`);
    result.severity = foundInappropriateWords.length > 2 ? 'high' : 'medium';
  }

  // 2. Verificar padrões suspeitos
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(comment)) {
      issues.push('Padrão suspeito detectado (URL, spam ou texto inadequado)');
      result.severity = result.severity === 'high' ? 'high' : 'medium';
      break;
    }
  }

  // 3. Verificar comentários muito curtos (possível spam)
  if (comment.trim().length < 3) {
    issues.push('Comentário muito curto');
    result.severity = 'low';
  }

  // 4. Verificar discrepância entre nota e sentimento (opcional)
  // Nota baixa (1-2) com palavrões pode ser genuína, mas múltiplas flags é suspeito
  if (rating <= 2 && foundInappropriateWords.length > 3) {
    issues.push('Múltiplas palavras inadequadas em avaliação negativa');
    result.severity = 'high';
  }

  // 5. Decisão final baseada na severidade
  if (result.severity === 'high') {
    result.approved = false;
    result.reason = issues.join('; ');
  } else if (result.severity === 'medium') {
    // Moderação manual obrigatória para casos de severidade média
    result.approved = false;
    result.reason = `Possível problema detectado (requer moderação manual): ${issues.join('; ')}`;
  } else if (result.severity === 'low') {
    result.approved = true;
    result.reason = issues.length > 0 ? issues.join('; ') : null;
  }

  return result;
}

/**
 * Verifica se uma avaliação deve ser marcada para revisão manual
 * @param {Object} moderation - Resultado da moderação
 * @returns {boolean}
 */
function requiresManualReview(moderation) {
  return moderation.severity === 'medium' || moderation.severity === 'high';
}

/**
 * Gera estatísticas de moderação
 * @param {Array} feedbacks - Lista de avaliações
 * @returns {Object} Estatísticas
 */
function getModerationStats(feedbacks) {
  const stats = {
    total: feedbacks.length,
    approved: 0,
    rejected: 0,
    pending: 0,
    autoModerated: 0,
    manualModerated: 0
  };

  feedbacks.forEach(feedback => {
    switch (feedback.moderation_status) {
      case 'approved':
        stats.approved++;
        break;
      case 'rejected':
        stats.rejected++;
        break;
      case 'pending':
        stats.pending++;
        break;
    }

    if (feedback.auto_moderated) {
      stats.autoModerated++;
    } else if (feedback.moderated_at) {
      stats.manualModerated++;
    }
  });

  return stats;
}

module.exports = {
  moderateContent,
  requiresManualReview,
  getModerationStats,
  inappropriateWords,
  suspiciousPatterns
};
