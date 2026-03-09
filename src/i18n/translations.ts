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
  },
};

/**
 * Get all translation keys (from the English map as the reference).
 */
export function getAllTranslationKeys(): string[] {
  return Object.keys(translations['en']);
}
