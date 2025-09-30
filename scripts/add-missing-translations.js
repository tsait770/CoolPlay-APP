const fs = require('fs');
const path = require('path');

// Missing translations for all languages
const missingTranslations = {
  'es': {
    "account_settings": "Configuración de cuenta",
    "login": "Iniciar sesión",
    "logout": "Cerrar sesión",
    "logout_confirm": "¿Está seguro de que desea cerrar sesión?",
    "account_info": "Información de cuenta",
    "subscription_plan": "Plan de suscripción",
    "device_management": "Gestión de dispositivos",
    "appearance_language": "Apariencia e idioma",
    "dark_mode": "Modo oscuro",
    "data_management": "Gestión de datos",
    "auto_backup": "Copia de seguridad automática",
    "export_backup": "Exportar copia de seguridad",
    "clear_cache": "Borrar caché",
    "clear_cache_confirm": "Esto borrará todos los datos en caché. ¿Continuar?",
    "reset_data": "Restablecer datos",
    "reset_data_confirm": "Esto eliminará todos los datos de la aplicación. Esta acción no se puede deshacer. ¿Continuar?",
    "smart_classification": "Clasificación inteligente",
    "enable_auto_classification": "Habilitar clasificación automática",
    "manage_classification_rules": "Gestionar reglas de clasificación",
    "advanced_classification_settings": "Configuración avanzada de clasificación",
    "sync_settings": "Configuración de sincronización",
    "sync_service": "Servicio de sincronización",
    "sync_frequency": "Frecuencia de sincronización",
    "daily": "Diario",
    "shortcuts": "Atajos",
    "quick_toggle": "Cambio rápido",
    "custom_shortcuts": "Atajos personalizados",
    "notification_settings": "Configuración de notificaciones",
    "enable_notifications": "Habilitar notificaciones",
    "notification_types": "Tipos de notificación",
    "push_frequency": "Frecuencia de notificaciones",
    "privacy_security": "Privacidad y seguridad",
    "biometric_lock": "Bloqueo biométrico",
    "data_encryption": "Cifrado de datos",
    "privacy_settings": "Configuración de privacidad",
    "help_support": "Ayuda y soporte",
    "faq": "Preguntas frecuentes",
    "contact_us": "Contáctanos",
    "tutorial": "Tutorial",
    "report_problem": "Reportar problema",
    "user_feedback": "Comentarios de usuarios",
    "version_info": "Información de versión",
    "check_updates": "Buscar actualizaciones"
  },
  'pt-BR': {
    "account_settings": "Configurações da conta",
    "login": "Entrar",
    "logout": "Sair",
    "logout_confirm": "Tem certeza de que deseja sair?",
    "account_info": "Informações da conta",
    "subscription_plan": "Plano de assinatura",
    "device_management": "Gerenciamento de dispositivos",
    "appearance_language": "Aparência e idioma",
    "dark_mode": "Modo escuro",
    "data_management": "Gerenciamento de dados",
    "auto_backup": "Backup automático",
    "export_backup": "Exportar backup",
    "clear_cache": "Limpar cache",
    "clear_cache_confirm": "Isso limpará todos os dados em cache. Continuar?",
    "reset_data": "Redefinir dados",
    "reset_data_confirm": "Isso excluirá todos os dados do aplicativo. Esta ação não pode ser desfeita. Continuar?",
    "smart_classification": "Classificação inteligente",
    "enable_auto_classification": "Ativar classificação automática",
    "manage_classification_rules": "Gerenciar regras de classificação",
    "advanced_classification_settings": "Configurações avançadas de classificação",
    "sync_settings": "Configurações de sincronização",
    "sync_service": "Serviço de sincronização",
    "sync_frequency": "Frequência de sincronização",
    "daily": "Diário",
    "shortcuts": "Atalhos",
    "quick_toggle": "Alternância rápida",
    "custom_shortcuts": "Atalhos personalizados",
    "notification_settings": "Configurações de notificação",
    "enable_notifications": "Ativar notificações",
    "notification_types": "Tipos de notificação",
    "push_frequency": "Frequência de notificações",
    "privacy_security": "Privacidade e segurança",
    "biometric_lock": "Bloqueio biométrico",
    "data_encryption": "Criptografia de dados",
    "privacy_settings": "Configurações de privacidade",
    "help_support": "Ajuda e suporte",
    "faq": "Perguntas frequentes",
    "contact_us": "Entre em contato",
    "tutorial": "Tutorial",
    "report_problem": "Relatar problema",
    "user_feedback": "Feedback do usuário",
    "version_info": "Informações da versão",
    "check_updates": "Verificar atualizações"
  }
};

// Add translations to each file
Object.entries(missingTranslations).forEach(([lang, translations]) => {
  const filePath = path.join(__dirname, '..', 'l10n', `${lang}.json`);
  
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    // Add missing translations
    Object.entries(translations).forEach(([key, value]) => {
      if (!data[key]) {
        data[key] = value;
      }
    });
    
    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`Updated ${lang}.json`);
  } catch (error) {
    console.error(`Error updating ${lang}.json:`, error);
  }
});

console.log('Translation update complete!');