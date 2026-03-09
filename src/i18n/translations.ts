// Translation maps for English and Traditional Chinese

export const translations: Record<string, Record<string, string>> = {
  en: {
    // Game UI
    'game.title': 'Kids Chess',
    'game.welcome': 'Welcome to Chess!',
    'game.restarted': 'Game restarted!',
    'game.play': 'Play',
    'game.playEasy': 'Play Easy',
    'game.playMedium': 'Play Medium',
    'game.hint': 'Hint',
    'game.boardPlaceholder': 'Select a piece to start!',
    'game.restart': 'Restart',
    'game.checkmate': 'Checkmate!',
    'game.checkmateWin': 'Checkmate! You win! 🎉',
    'game.checkmateLose': 'Oh no, checkmate! 😢',
    'game.stalemate': "It's a draw! 🤝",
    'game.draw': "It's a draw! 🤝",
    'game.check': 'Check! ⚠️',
    'game.playAgain': 'Play Again',

    // Piece names
    'piece.king': 'King',
    'piece.queen': 'Queen',
    'piece.rook': 'Rook',
    'piece.bishop': 'Bishop',
    'piece.knight': 'Knight',
    'piece.pawn': 'Pawn',

    // Hint system
    'hint.button': 'Hint 💡',
    'hint.capture': 'Try capturing that piece!',
    'hint.checkmate': 'This move gives checkmate!',
    'hint.positional': 'Move your piece to a better position!',

    // Score
    'score.current': 'Score: {score}',
    'score.high': 'High Score: {score}',
    'score.points': '{points} points',

    // Difficulty
    'difficulty.easy': 'Easy',
    'difficulty.medium': 'Medium',
    'difficulty.select': 'Select Difficulty',

    // Language toggle
    'language.toggle': 'English / 繁體中文',

    // Go game
    'go.title': 'Kids Go',
    'go.black': 'Black',
    'go.white': 'White',
    'go.pass': 'Pass',
    'go.resign': 'Resign',
    'go.score': 'Score',
    'go.territory': 'Territory',
    'go.captured': 'Captured',
    'go.komi': 'Komi',
    'go.hint.capture': 'You can capture stones here!',
    'go.hint.defend': 'Protect your stones!',
    'go.hint.territory': 'Expand your territory!',
    'go.hint.general': 'This looks like a good spot!',
    'go.status.playing': 'Game in progress',
    'go.status.finished': 'Game over',
    'go.status.blackWins': 'Black wins! 🎉',
    'go.status.whiteWins': 'White wins! 🎉',
    'go.status.tie': "It's a tie! 🤝",
    'go.status.resigned': '{player} resigned',
    'go.confirmResign': 'Are you sure you want to resign?',
    'go.newGame': 'New Game',
    'go.difficulty.easy': 'Easy',
    'go.difficulty.medium': 'Medium',
    'go.mode.vsAi': 'vs AI',
    'go.mode.vsPlayer': '2 Players',
    'go.turn.black': "Black's turn ⚫",
    'go.turn.white': "White's turn ⚪",
    'go.playAgain': 'Play Again',

    // Game selector
    'gameSelector.title': 'Choose a Game',
    'gameSelector.chess': 'Chess ♟️',
    'gameSelector.go': 'Go ⚫',

    // Shared game keys
    'game.play2Player': '2 Players',
  },

  'zh-TW': {
    // Game UI
    'game.title': '兒童西洋棋',
    'game.welcome': '歡迎來到西洋棋！',
    'game.restarted': '遊戲已重新開始！',
    'game.play': '開始',
    'game.playEasy': '簡單模式',
    'game.playMedium': '中等模式',
    'game.hint': '提示',
    'game.boardPlaceholder': '選擇一個棋子開始！',
    'game.restart': '重新開始',
    'game.checkmate': '將死！',
    'game.checkmateWin': '將死！你贏了！🎉',
    'game.checkmateLose': '哎呀，將死了！😢',
    'game.stalemate': '和棋！🤝',
    'game.draw': '和棋！🤝',
    'game.check': '將軍！⚠️',
    'game.playAgain': '再玩一次',

    // Piece names
    'piece.king': '國王',
    'piece.queen': '皇后',
    'piece.rook': '城堡',
    'piece.bishop': '主教',
    'piece.knight': '騎士',
    'piece.pawn': '兵',

    // Hint system
    'hint.button': '提示 💡',
    'hint.capture': '試試吃掉那個棋子！',
    'hint.checkmate': '這步棋將軍！',
    'hint.positional': '把你的棋子移到更好的位置！',

    // Score
    'score.current': '分數：{score}',
    'score.high': '最高分：{score}',
    'score.points': '{points} 分',

    // Difficulty
    'difficulty.easy': '簡單',
    'difficulty.medium': '中等',
    'difficulty.select': '選擇難度',

    // Language toggle
    'language.toggle': 'English / 繁體中文',

    // Go game
    'go.title': '兒童圍棋',
    'go.black': '黑棋',
    'go.white': '白棋',
    'go.pass': '虛手',
    'go.resign': '認輸',
    'go.score': '分數',
    'go.territory': '領地',
    'go.captured': '吃子',
    'go.komi': '貼目',
    'go.hint.capture': '你可以在這裡吃子！',
    'go.hint.defend': '保護你的棋子！',
    'go.hint.territory': '擴展你的領地！',
    'go.hint.general': '這看起來是個好位置！',
    'go.status.playing': '遊戲進行中',
    'go.status.finished': '遊戲結束',
    'go.status.blackWins': '黑棋贏了！🎉',
    'go.status.whiteWins': '白棋贏了！🎉',
    'go.status.tie': '平手！🤝',
    'go.status.resigned': '{player} 認輸了',
    'go.confirmResign': '你確定要認輸嗎？',
    'go.newGame': '新遊戲',
    'go.difficulty.easy': '簡單',
    'go.difficulty.medium': '中等',
    'go.mode.vsAi': '對電腦',
    'go.mode.vsPlayer': '雙人對戰',
    'go.turn.black': '黑棋的回合 ⚫',
    'go.turn.white': '白棋的回合 ⚪',
    'go.playAgain': '再玩一次',

    // Game selector
    'gameSelector.title': '選擇遊戲',
    'gameSelector.chess': '西洋棋 ♟️',
    'gameSelector.go': '圍棋 ⚫',

    // Shared game keys
    'game.play2Player': '雙人對戰',
  },
};

/**
 * Get all translation keys (from the English map as the reference).
 */
export function getAllTranslationKeys(): string[] {
  return Object.keys(translations['en']);
}
