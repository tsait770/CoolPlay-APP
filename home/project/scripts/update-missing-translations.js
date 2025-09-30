const fs = require('fs');
const path = require('path');

// Define missing translations for all languages
const missingTranslations = {
  "en": {
    "valid_referral_code": "Valid referral code",
    "not_system_generated": "Not a system-generated code",
    "example_skip_intro": "Example: Skip Intro",
    "replay": "Replay",
    "replay_example": "replay_example",
    "manage_custom_commands": "Manage Custom Commands",
    "custom_command": "Custom Command"
  },
  "zh-TW": {
    "valid_referral_code": "有效的優惠碼",
    "not_system_generated": "非系統生成的代碼",
    "example_skip_intro": "例如：跳過片頭",
    "replay": "重播",
    "replay_example": "replay_example",
    "manage_custom_commands": "管理自定義指令",
    "custom_command": "自定義指令"
  },
  "zh-CN": {
    "valid_referral_code": "有效的优惠码",
    "not_system_generated": "非系统生成的代码",
    "example_skip_intro": "例如：跳过片头",
    "replay": "重播",
    "replay_example": "replay_example",
    "manage_custom_commands": "管理自定义指令",
    "custom_command": "自定义指令"
  },
  "es": {
    "valid_referral_code": "Código de referencia válido",
    "not_system_generated": "No es un código generado por el sistema",
    "example_skip_intro": "Ejemplo: Saltar introducción",
    "replay": "Repetir",
    "replay_example": "replay_example",
    "manage_custom_commands": "Administrar comandos personalizados",
    "custom_command": "Comando personalizado"
  },
  "pt-BR": {
    "valid_referral_code": "Código de referência válido",
    "not_system_generated": "Não é um código gerado pelo sistema",
    "example_skip_intro": "Exemplo: Pular introdução",
    "replay": "Repetir",
    "replay_example": "replay_example",
    "manage_custom_commands": "Gerenciar comandos personalizados",
    "custom_command": "Comando personalizado"
  },
  "pt": {
    "valid_referral_code": "Código de referência válido",
    "not_system_generated": "Não é um código gerado pelo sistema",
    "example_skip_intro": "Exemplo: Saltar introdução",
    "replay": "Repetir",
    "replay_example": "replay_example",
    "manage_custom_commands": "Gerir comandos personalizados",
    "custom_command": "Comando personalizado"
  },
  "de": {
    "valid_referral_code": "Gültiger Empfehlungscode",
    "not_system_generated": "Kein systemgenerierter Code",
    "example_skip_intro": "Beispiel: Intro überspringen",
    "replay": "Wiederholen",
    "replay_example": "replay_example",
    "manage_custom_commands": "Benutzerdefinierte Befehle verwalten",
    "custom_command": "Benutzerdefinierter Befehl"
  },
  "fr": {
    "valid_referral_code": "Code de parrainage valide",
    "not_system_generated": "Pas un code généré par le système",
    "example_skip_intro": "Exemple : Passer l'intro",
    "replay": "Rejouer",
    "replay_example": "replay_example",
    "manage_custom_commands": "Gérer les commandes personnalisées",
    "custom_command": "Commande personnalisée"
  },
  "ru": {
    "valid_referral_code": "Действительный реферальный код",
    "not_system_generated": "Не системный код",
    "example_skip_intro": "Пример: Пропустить вступление",
    "replay": "Повтор",
    "replay_example": "replay_example",
    "manage_custom_commands": "Управление пользовательскими командами",
    "custom_command": "Пользовательская команда"
  },
  "ar": {
    "valid_referral_code": "رمز إحالة صالح",
    "not_system_generated": "ليس رمزًا تم إنشاؤه بواسطة النظام",
    "example_skip_intro": "مثال: تخطي المقدمة",
    "replay": "إعادة تشغيل",
    "replay_example": "replay_example",
    "manage_custom_commands": "إدارة الأوامر المخصصة",
    "custom_command": "أمر مخصص"
  },
  "ja": {
    "valid_referral_code": "有効な紹介コード",
    "not_system_generated": "システム生成コードではありません",
    "example_skip_intro": "例：イントロをスキップ",
    "replay": "リプレイ",
    "replay_example": "replay_example",
    "manage_custom_commands": "カスタムコマンドの管理",
    "custom_command": "カスタムコマンド"
  },
  "ko": {
    "valid_referral_code": "유효한 추천 코드",
    "not_system_generated": "시스템 생성 코드가 아님",
    "example_skip_intro": "예: 인트로 건너뛰기",
    "replay": "다시 재생",
    "replay_example": "replay_example",
    "manage_custom_commands": "사용자 지정 명령 관리",
    "custom_command": "사용자 지정 명령"
  }
};

// Update each language file
Object.keys(missingTranslations).forEach(lang => {
  const filePath = path.join(__dirname, '..', 'l10n', `${lang}.json`);
  
  try {
    // Read existing file
    let content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Add missing translations
    content = {
      ...content,
      ...missingTranslations[lang]
    };
    
    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
    console.log(`✅ Updated ${lang}.json`);
  } catch (error) {
    console.error(`❌ Error updating ${lang}.json:`, error.message);
  }
});

console.log('✅ All language files updated successfully!');