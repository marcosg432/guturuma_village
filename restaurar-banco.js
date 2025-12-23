// Script para restaurar um backup do banco SQLite
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const dbPath = path.join(__dirname, 'database', 'brisa_imperial.db');
const backupDir = path.join(__dirname, 'backups');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function pergunta(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function restaurarBackup() {
  try {
    // Listar backups disponíveis
    if (!fs.existsSync(backupDir)) {
      console.log('❌ Diretório de backups não encontrado:', backupDir);
      rl.close();
      return;
    }
    
    const backups = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.db'))
      .map(file => {
        const filePath = path.join(backupDir, file);
        const fileStats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          size: fileStats.size,
          date: fileStats.mtime
        };
      })
      .sort((a, b) => b.date - a.date);
    
    if (backups.length === 0) {
      console.log('❌ Nenhum backup encontrado no diretório:', backupDir);
      rl.close();
      return;
    }
    
    console.log('='.repeat(60));
    console.log('📦 BACKUPS DISPONÍVEIS');
    console.log('='.repeat(60));
    backups.forEach((backup, idx) => {
      const sizeMB = (backup.size / 1024 / 1024).toFixed(2);
      console.log(`${idx + 1}. ${backup.name}`);
      console.log(`   Tamanho: ${sizeMB} MB`);
      console.log(`   Data: ${backup.date.toLocaleString('pt-BR')}`);
      console.log('');
    });
    
    // Pedir qual backup restaurar
    const resposta = await pergunta(`\nQual backup deseja restaurar? (1-${backups.length}): `);
    const indice = parseInt(resposta) - 1;
    
    if (isNaN(indice) || indice < 0 || indice >= backups.length) {
      console.log('❌ Opção inválida!');
      rl.close();
      return;
    }
    
    const backupEscolhido = backups[indice];
    
    // Confirmar
    console.log(`\n⚠️  ATENÇÃO: Esta operação irá substituir o banco atual!`);
    console.log(`   Backup selecionado: ${backupEscolhido.name}`);
    console.log(`   Banco atual será substituído por este backup.\n`);
    
    const confirmacao = await pergunta('Deseja continuar? (sim/não): ');
    
    if (confirmacao.toLowerCase() !== 'sim' && confirmacao.toLowerCase() !== 's') {
      console.log('❌ Operação cancelada.');
      rl.close();
      return;
    }
    
    // Fazer backup do banco atual antes de restaurar
    if (fs.existsSync(dbPath)) {
      const agora = new Date();
      const timestamp = agora.toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                       agora.toTimeString().split(' ')[0].replace(/:/g, '-');
      const backupAtualPath = path.join(backupDir, `backup_pre_restore_${timestamp}.db`);
      fs.copyFileSync(dbPath, backupAtualPath);
      console.log(`\n💾 Backup do banco atual criado: ${backupAtualPath}`);
    }
    
    // Restaurar backup
    fs.copyFileSync(backupEscolhido.path, dbPath);
    
    const stats = fs.statSync(dbPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    
    console.log('='.repeat(60));
    console.log('✅ BANCO RESTAURADO COM SUCESSO!');
    console.log('='.repeat(60));
    console.log(`📁 Backup restaurado: ${backupEscolhido.name}`);
    console.log(`💾 Banco restaurado em: ${dbPath}`);
    console.log(`📊 Tamanho: ${sizeMB} MB`);
    console.log(`🕐 Data/Hora: ${new Date().toLocaleString('pt-BR')}`);
    console.log('='.repeat(60));
    console.log('\n💡 Importante: Reinicie o servidor para que as mudanças tenham efeito!');
    
    rl.close();
    
  } catch (error) {
    console.error('❌ Erro ao restaurar backup:', error);
    rl.close();
    process.exit(1);
  }
}

// Executar
restaurarBackup();






