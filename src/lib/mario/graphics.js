// Pixel patterns are redrawn in code; no DOM or image assets are needed at import.
import { CAMPAIGN_ROWS, CAMPAIGN_PALETTE } from './campaign-sprites.js';

const WIDTH = 256, HEIGHT = 240;
const COLORS = {
  mario: { r: '#d82800', b: '#887000', s: '#fc9838', w: '#fcfcfc', k: '#000000' },
  fire: { r: '#fcfcfc', b: '#d82800', s: '#fc9838', w: '#fcfcfc', k: '#000000' },
  tile: { k: '#000000', b: '#c84c0c', s: '#fca044', w: '#fcfcfc' },
  terrain: { k: '#000000', b: '#c84c0c', s: '#fcbcb0', a: '#fc9838' },
  underground: { k: '#000000', b: '#008088', s: '#9cfcf0', w: '#fcfcfc' },
  scenery: { k: '#000000', g: '#00a800', l: '#80d010', d: '#004400', w: '#fcfcfc', c: '#3cbcfc' },
  green: { k: '#000000', b: '#00a800', s: '#b8f818', w: '#fcfcfc' },
  enemy: { k: '#000000', b: '#c84c0c', s: '#fcbcb0', w: '#fcfcfc' },
  actor: { k: '#000000', a: '#fc9838', b: '#c84c0c', c: '#000000', r: '#d82800', g: '#00a800', w: '#fcfcfc' },
};

function pattern(rows) {
  const spans = [];
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length;) {
      const color = rows[y][x], start = x++;
      while (rows[y][x] === color) x++;
      if (color !== '.') spans.push([start, y, x - start, color]);
    }
  }
  return { spans, w: Math.max(...rows.map(r => r.length)), h: rows.length };
}

const MARIO_SMALL = {
  idle: pattern([
    '.....rrrrr......','....rrrrrrrrr...','....bbbssbs.....','...bsbsssbsss...',
    '...bsbbsssbsss..','...bbssssbbbb...','.....sssssss....','....bbrbbb......',
    '...bbbrbbrbbb...','..bbbbrrrrbbbb..','..ssbrsrrsrbss..','..sssrrrrrrsss..',
    '..ssrrrrrrrrss..','....rrr..rrr....','...bbb....bbb...','..bbbb....bbbb..',
  ]),
  run0: pattern([
    '................','......rrrrr.....','.....rrrrrrrrr..','.....bbbssbs....',
    '....bsbsssbsss..','....bsbbsssbss..','....bbssssbbbb..','......sssssss...',
    '.....bbbbrb.s...','....sbbbbbbsss..','...ssrbbbbbss...','...bbrrrrrrr....',
    '...brrrrrrrr....','..bbrrr.rrr.....','..b....bbb......','.......bbbb.....',
  ]),
  run1: pattern([
    '....rrrrr.......','...rrrrrrrrr....','...bbbssbs......','..bsbsssbsss....',
    '..bsbbsssbsss...','..bbssssbbbb....','....sssssss.....','...bbrbbb.......',
    '..bbbbrrbb......','..bbbrrsrrs.....','..bbbbrrrrr.....','..rbbsssrrr.....',
    '...rbssrrr......','....rrrbbb......','....bbbbbbb.....','....bbbb........',
  ]),
  run2: pattern([
    '......rrrrr.....','.....rrrrrrrrr..','.....bbbssbs....','....bsbsssbsss..',
    '....bsbbsssbsss.','....bbssssbbbb..','......sssssss...','...bbbbrrbb.....',
    '.ssbbbbrrrbbbsss','.sss.bbrsrrrbbss','.ss..rrrrrrr..b.','....rrrrrrrrrbb.',
    '...rrrrrrrrrrbb.','..bbrrr...rrrbb.','..bbb...........','...bbb..........',
  ]),
  jump: pattern([
    '.............sss','......rrrrr..sss','.....rrrrrrrrrss','.....bbbssbs.bbb',
    '....bsbsssbssbbb','....bsbbsssbsssb','....bbssssbbbbb.','......sssssssb..',
    '..bbbbbrbbbrb...','.bbbbbbbrbbbr..b','ssbbbbbbrrrrr..b','sss.rrbrrsrrsrbb',
    '.s.brrrrrrrrrrbb','..bbbrrrrrrrrrbb','.bbbrrrrrrr.....','.b..rrrr........',
  ]),
  skid: pattern([
    '.......rrrrr....','.....brrrrrrrr..','....bbbbbbsbs...','...ssbssbssssss.',
    '...ssbssbbssbbss','....ssbssssssbb.','.....rrrbbbrss..','....rrsssbrrbbb.',
    '....rbsssbbbbbb.','....rrrssbbbbbb.','.....rrrrrbbbb..','.....rbbbrrrr...',
    '......bbbbrrr...','...b.brrbbbr....','...bbbbbr.......','....bbbb........',
  ]),
  death: pattern([
    '................','................','......rrrr......','...s.rrrrrr.s...',
    '.sssbsbssbsbsss.','.ssbbsbssbsbbss.','.ssbbbssssbbbss.','...bbbbssbbbb...',
    '....bsbbbbsb....','....bssssssb....','...rrrssssrrr...','..bbrrbbbbrrbb..',
    '..bbbrrbbrrbbb..','..bbbrsrrsrbbb..','..bbbrrrrrrbbb..','...bbrrrrrrbb...',
  ]),
};
// Native pose silhouettes are transcribed from the reference sprite sheet.
const MARIO_BIG = {
  idle: pattern([
    '................','......rrrrr.....','....rrrrrrs.....','...rrrrrrss.....',
    '...rrrrrrrrrrr..','...bbbssbsss....','..bssbssbbssss..','..bssbbssssssss.',
    '.bbssbbsssbssss.','.bbsssssbbbbbb..','..bbsssssbbbbb..','...bbssssssss...',
    '....rrrrss......','...brbbrrbb.....','..brbbbbrrb.....','..brbbbbrrbb....',
    '..brbbbbrrrb....','..brbbbbbssb....','..brbbbbssss....','..rrbbbbssssr...',
    '..rrrbbbssssrr..','..rrrrbbsssrrr..','..rrrrrrbbrrrr..','...rrrrrbbbrr...',
    '....rrrbbbbbb...','....rrbbbbbb....','.....rrbbbb.....','.....brrrbbb....',
    '.....bbbb.bb....','....bbbbb.......','....bbbbbbb.....','......bbbbb.....',
  ]),
  run0: pattern([
    '................','................','................','.......rrrrr....',
    '.....rrrrrrs....','....rrrrrrss....','....rrrrrrrrrrr.','....bbbssbsss...',
    '...bssbssbbssss.','...bssbbssssssss','..bbssbbsssbssss','..bbsssssbbbbbb.',
    '...bbsssssbbssss','.....bssbbbssss.','....brrbbbbbss..','...brrbbbbbbs...',
    '...brbbbbbb.....','...brbbbbbrb....','...brbbbbrrb....','....rrbbrrrbb...',
    '....rrrrrrrrb...','....rrrrrsrrr...','...rrrrrrrrrr...','...rrrrrrrrrr...',
    '...rrrrrrrrrr...','..bbrrrrrrrr....','bbbbrrrrrrr.....','bbbbrrrrr.......',
    'bbbbrrrb........','bbbb.bb.........','bb...bb.........','b....b..........',
  ]),
  run1: pattern([
    '................','................','......rrrrr.....','....rrrrrrs.....',
    '...rrrrrrss.....','...rrrrrrrrrrr..','...bbbssbsss....','..bssbssbbssss..',
    '..bssbbssssssss.','.bbssbbsssbssss.','.bbsssssbbbbbb..','..bbsssssbbbbb..',
    '....bssssssss...','...brrrsss......','..brbbbrb.......','..brbbbbrb......',
    '.bbrbbbbbr......','.brrbbbbbbr.....','.brrrbbbbbbss...','..rrrbbbbbbsss..',
    '..rrrrbbbbbssss.','..rrrrrrbbbssss.','..rrrrrrrrrr.ss.','..rrrrrrrrr.....',
    '..rrrrrrrrr.....','..rrrrrrrr......','..brrrrr........','.bbbrrr.........',
    '.bbbbb..........','.bbbb...........','.bbb............','..bb............',
  ]),
  run2: pattern([
    '................','................','................','.......rrrrr....',
    '.....rrrrrrs....','....rrrrrrss....','....rrrrrrrrrrr.','....bbbssbsss...',
    '...bssbssbbssss.','...bssbbssssssss','..bbssbbsssbssss','..bbsssssbbbbbb.',
    '...bbsssssbbbbb.','.....bssssssss..','....brrrsss.....','...brbbbrb......',
    '...brbbbbrb.....','..bbrbbbbbr.....','..brrbbbbbbr....','..brrrbbbbbbss..',
    '...rrrbbbbbbsss.','...rrrrbbbbbssss','...rrrrrrbbbssss','...rrrrrrrrrr.ss',
    '...rrrrrrrrr....','..bbrrrrrrrr....','bbbbrrrrrrr.....','bbbbrrrrr.......',
    'bbbbrrrb........','bbbb.bb.........','bb...bb.........','b....b..........',
  ]),
  jump: pattern([
    '......rrrrr.....','....rrrrrrs.....','...rrrrrrss.....','...rrrrrrrrrrr..',
    '...bbbssbsss....','..bssbssbbssss..','..bssbbssssssss.','.bbssbbsssbssss.',
    '.bbsssssbbbbbb..','.bbbsssssbbbbb..','...bbssssssss...','.....bbbss......',
    '....rrrrbbr...s.','...bbbbrrbbr.sss','..bbbbbbrrbrbsss','.bbbbbbbrrbbrsss',
    '.bbbbbbbrrbbrbsb','.bbbbbbrrrbbrbb.','bbbbbbrrrsrbsb..','bbbbrrrrrrrrr...',
    'sssssrrrrrrrr...','sssssrrrrrrrr..b','ssssrrrrrrrrr.bb','.sssrrrrrrrbbbbb',
    '...rbrrrrrrbbbbb','..brrbrrrrrbbbbb','bbbrrrbbrrrbbbbb','bbbbrrrr...bbbbb',
    'bbbbbr..........','.bbb............','.bbb............','..bbb...........',
  ]),
  skid: pattern([
    '................','................','......rrrrr.....','....rrrrrrs.....',
    '...rrrrrrss.....','...rrrrrrrrrrr..','...bbbssbsss....','..bssbssbbssss..',
    '..bssbbssssssss.','.bbssbbsssbssss.','.bbsssssbbbbbb..','..bbsssssbbssss.',
    '....rssbbbssss..','...brrbbbbbss...','..brrbbbbbbs....','..brbbbbbb......',
    '..brbbbbbrb.....','..brbbbbrrb.....','...rrbbrrrbb....','...rrrrrrrrb....',
    '...rrrrrsrrr....','..rrrrrrrrrr....','..rrrrrrrrrr....','..rrrrrrrrrr....',
    '..rrrrrrrrr.....','..rrrrrrrrrb.bb.','...rrrrrrrbbbbb.','....rrrrrrbbbbb.',
    '......rrrrbbbb..','.........bbbbb..','...........bb...','............b...',
  ]),
  crouch: pattern([
    '................','................','.......rrrrr....','.....rrrrrrs....',
    '....rrrrrrss....','....rrrrrrrrrrr.','....bbbssbsss...','...bssbssbbssss.',
    '..bbsssbsssbssss','..bbsssssbbbbbb.','..rrbsssssbbbbb.','.bbbrbsssssssss.',
    '.bbbrbbbsssbbrb.','bbbbrbbbbbbbbrb.','bbbbrbbbbbbbrrbb','bbbbrsbbbbbrrbbb',
    'bbbbrrrrrrrrbbbb','bbbbbrrrrrrbbbbb','bbbsssrrrrsssbbb','rbssssrrrrssssbr',
    'rssssrrrrrrssssr','.rssb......bssr.','..bbbb....bbbb..','bbbbbb....bbbbbb',
  ]),
};

const SPRITES = {
  oneup: pattern([
    '......aaaa......','.....aaaagg.....','....aaaagggg....','...aaaaaggggg...',
    '..aaaaaaagggaa..','.aagggaaaaaaaaa.','.agggggaaaaaaaa.','aagggggaaaaaggaa',
    'aagggggaaaaaggga','aaagggaaaaaaagga','aaaaaaaaaaaaaaaa','.agggwwwwwwggga.',
    '....wwwwwwww....','....wwwwwwaw....','....wwwwwwaw....','.....wwwwaw.....',
  ]),
  koopaStep: pattern([
    '...w............','..www...........','..wwwa..........','.agwwaa.........',
    '.agwwaa.........','.agwwaa.........','.awwwaa.........','aaawaaa.........',
    'agaaaaa.........','aaaaaa..ggggg...','aaa.aa.gagggag..','aa..aa.ggagaggg.',
    'aa.aawggggagwwg.','.a.aawgggagagwg.','...aawagagggaga.','..aawwgagggggag.',
    '...awgagagggaga.','...awagggagaggg.','....wgggggagggg.','....wwgggagagwww',
    '...aawwwaggwww..','..aaaaawwwwwaaa.','.aaaaa......aaaa','................',
  ]),
  goombaStep: pattern([
    '......bbbb......','.....bbbbbb.....','....bbbbbbbb....','...bbbbbbbbbb...',
    '..bkkbbbbbbkkb..','.bbbskbbbbksbbb.','.bbbskkkkkksbbb.','bbbbsksbbsksbbbb',
    'bbbbsssbbsssbbbb','bbbbbbbbbbbbbbbb','.bbbbssssssbbbb.','....ssssssss....',
    '....sssssssskk..','...kkssssskkkkk.','...kkkssskkkkkk.','....kkk..kkkkk..',
  ]),
  undergroundBrick: pattern([
    'bbbbbbbkbbbbbbbk','bbbbbbbkbbbbbbbk','bbbbbbbkbbbbbbbk','kkkkkkkkkkkkkkkk',
    'bbbkbbbbbbbkbbbb','bbbkbbbbbbbkbbbb','bbbkbbbbbbbkbbbb','kkkkkkkkkkkkkkkk',
    'bbbbbbbkbbbbbbbk','bbbbbbbkbbbbbbbk','bbbbbbbkbbbbbbbk','kkkkkkkkkkkkkkkk',
    'bbbkbbbbbbbkbbbb','bbbkbbbbbbbkbbbb','bbbkbbbbbbbkbbbb','kkkkkkkkkkkkkkkk',
  ]),
  ground: pattern([
    'bsssssssskbssssb','sbbbbbbbbksbbbbk','sbbbbbbbbksbbbbk','sbbbbbbbbksbbbbk',
    'sbbbbbbbbkskbbbk','sbbbbbbbbkbkkkkb','sbbbbbbbbksssssk','sbbbbbbbbksbbbbk',
    'sbbbbbbbbksbbbbk','sbbbbbbbbksbbbbk','kkbbbbbbksbbbbbk','sskkbbbbksbbbbbk',
    'sbsskkkksbbbbbbk','sbbbsssksbbbbbbk','sbbbbbbksbbbbbkk','bkkkkkkbskkkkkkb',
  ]),
  brick: pattern([
    'ssssssssssssssss','bbbbbbbkbbbbbbbk','bbbbbbbkbbbbbbbk','kkkkkkkkkkkkkkkk',
    'bbbkbbbbbbbkbbbb','bbbkbbbbbbbkbbbb','bbbkbbbbbbbkbbbb','kkkkkkkkkkkkkkkk',
    'bbbbbbbkbbbbbbbk','bbbbbbbkbbbbbbbk','bbbbbbbkbbbbbbbk','kkkkkkkkkkkkkkkk',
    'bbbkbbbbbbbkbbbb','bbbkbbbbbbbkbbbb','bbbkbbbbbbbkbbbb','kkkkkkkkkkkkkkkk',
  ]),
  question: pattern([
    '.bbbbbbbbbbbbbb.','baaaaaaaaaaaaaak','bakaaaaaaaaaakak','baaaabbbbbaaaaak',
    'baaabbkkkbbaaaak','baaabbkaabbkaaak','baaabbkaabbkaaak','baaaakkabbbkaaak',
    'baaaaaabbkkkaaak','baaaaaabbkaaaaak','baaaaaaakkaaaaak','baaaaaabbaaaaaak',
    'baaaaaabbkaaaaak','bakaaaaakkaaakak','baaaaaaaaaaaaaak','kkkkkkkkkkkkkkkk',
  ]),
  used: pattern([
    '.kkkkkkkkkkkkkk.','kbbbbbbbbbbbbbbk','kbkbbbbbbbbbbkbk','kbbbbbbbbbbbbbbk',
    'kbbbbbbbbbbbbbbk','kbbbbbbbbbbbbbbk','kbbbbbbbbbbbbbbk','kbbbbbbbbbbbbbbk',
    'kbbbbbbbbbbbbbbk','kbbbbbbbbbbbbbbk','kbbbbbbbbbbbbbbk','kbbbbbbbbbbbbbbk',
    'kbbbbbbbbbbbbbbk','kbkbbbbbbbbbbkbk','kbbbbbbbbbbbbbbk','.kkkkkkkkkkkkkk.',
  ]),
  stone: pattern([
    'bssssssssssssssk','sbsssssssssssskk','ssbsssssssssskkk','sssbsssssssskkkk',
    'ssssbbbbbbbbkkkk','ssssbbbbbbbbkkkk','ssssbbbbbbbbkkkk','ssssbbbbbbbbkkkk',
    'ssssbbbbbbbbkkkk','ssssbbbbbbbbkkkk','ssssbbbbbbbbkkkk','ssssbbbbbbbbkkkk',
    'ssskkkkkkkkkbkkk','sskkkkkkkkkkkbkk','skkkkkkkkkkkkkbk','kkkkkkkkkkkkkkkb',
  ]),
  goomba: pattern([
    '......bbbb......','.....bbbbbb.....','....bbbbbbbb....','...bbbbbbbbbb...',
    '..bkkbbbbbbkkb..','.bbbskbbbbksbbb.','.bbbskkkkkksbbb.','bbbbsksbbsksbbbb',
    'bbbbsssbbsssbbbb','bbbbbbbbbbbbbbbb','.bbbbssssssbbbb.','....ssssssss....',
    '..kkssssssss....','.kkkkkssssskk...','.kkkkkkssskkk...','..kkkkk..kkk....',
  ]),
  squashed: pattern([
    '................','................','................','................',
    '................','................','................','................',
    '......bbbb......','...bbbbbbbbbb...','.bbkkkbbbbkkkbb.','bbsssskkkkssssbb',
    'bbbbbbbbbbbbbbbb','...ssssssssss...','....ssssssss....','.kkkkk....kkkkk.',
  ]),
  koopa: pattern([
    '....w...........','...www..........','..awww..........','..agwwa.........',
    '.aagwwa.........','.aagwwa.........','.aawwwa.........','agaawaa.........',
    'aaaaaaa.........','aaa..aa.ggggg...','aa...awgagggag..','....aawggagagg..',
    '...aawggggagwwg.','.aaaawgggagagwg.','..aaawagagggaga.','...awwgagggggag.',
    '...awgagagggaga.','...awagggagaggg.','....wgggggagggg.','....wwgggagagwww',
    '....awwwaggwwwa.','....aaawwwwwaaa.','.....aaa....aaa.','......aaa..aaa..',
  ]),
  shell: pattern([
    '.....agggga.....','....ggaaaagg....','...ggaggggagg...','...gaggggggag...',
    '..gaggggggggag..','..agaggggggaga..','.agggaggggaggga.','.gggggaaaaggggg.',
    'wwwggaggggaggwww','wwwwaggggggawwww','..awwggggggwwa..','.aaawwggggwwaaa.',
    '.aaa.wwwwww.aaa.','.aa...wwww...aa.','.a............a.','................',
  ]),
  mushroom: pattern([
    '......aaaa......','.....aaaarr.....','....aaaarrrr....','...aaaaarrrrr...',
    '..aaaaaaarrraa..','.aarrraaaaaaaaa.','.arrrrraaaaaaaa.','aarrrrraaaaarraa',
    'aarrrrraaaaarrra','aaarrraaaaaaarra','aaaaaaaaaaaaaaaa','.arrrwwwwwwrrra.',
    '....wwwwwwww....','....wwwwwwaw....','....wwwwwwaw....','.....wwwwaw.....',
  ]),
  flower: pattern([
    '....wwwwwwww....','..wwwwwwwwwwww..','.wwwaaaaaaaawww.','wwaaaggggggaaaww',
    'wwaaaggggggaaaww','.wwwaaaaaaaawww.','..wwwwwwwwwwww..','....wwwwwwww....',
    '.......gg.......','ggg....gg....ggg','.ggg...gg...ggg.','.gggg..gg..gggg.',
    '..gggg.gg.gggg..','..gggg.gg.gggg..','...gggggggggg...','......gggg......',
  ]),
  star: pattern([
    '.......aa.......','.......aa.......','......aaaa......','......aaaa......',
    '.....aaaaaa.....','.aaaaaaaaaaaaaa.','.aaaaagaagaaaaa.','..aaaagaagaaaa..',
    '...aaagaagaaa...','....aaaaaaaa....','....aaaaaaaa....','...aaaaaaaaaa...',
    '...aaaaaaaaaa...','...aaaa..aaaa...','..aaa......aaa..','..aa........aa..',
  ]),
  coin: pattern([
    '................','................','.....aaaacc.....','....aaaaaacc....',
    '....aabbaacc....','...aabaacaacc...','...aabaacaacc...','...aabaacaacc...',
    '...aabaacaacc...','...aabaacaacc...','...aabaacaacc...','...aabaacaacc...',
    '...aabaacaacc...','....aaccaacc....','....aaaaaacc....','.....aaaacc.....',
  ]),
  fireball: pattern(['..ss....','.swws...','swbbs...','swbbs.s.','.sbbssws','..swwwws','...ssss.','........']),
  cloud: pattern([
    '..............kkkk..............','.............kwwwwk.............','...........kkwwwwwwk............','..........kwwwwwwwwk.k..........',
    '..........kwwwwwwwwwkwk.........','..........kwwwwwwcwwwwwk........','.........kwwwccwwwcwwwwk........','........kwwwcwwwwwwwwwwk........',
    '.....kkkwwwwwwwwwwwwwwwwk..k....','....kwwwwwwwwwwwwwwwwwwwk.kwk...','...kwwwwwwwwwwwwwwwwwwwwwkwwk...','...wwwwwwwwwwwwwwwwwwwwwwwwwk.k.',
    '.kkwwwwwwwwwwwwwwwwwwwwwwwwwwkwk','kwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwk','kwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwk','.kwwwwwwwwwwwwwwwwwwwwwwwwwwwwk.',
    '..kwwcwwwwwwwwwwwcwwwwwwwwwwwk..','...kwwcwwcwwwwwwcwwwwwwwwwwwwwk.','....kwwccccwwwccccwwwwcwwwwwwwwk','....kwwwwwccccccwcccccwwwwwwwww.',
    '.....kkkwwwwccwwwwcccwwwwwwwwkk.','........kwwwwwwkwwwwwwwwkwwkk...','.........kkwwwk.kkwwwwkk.kk.....','...........kkk....kkkk..........',
  ]),
};

// Scenery and pipe patterns use the map reference at its native pixel resolution.
const SCENERY = {
  flagCap: pattern([
    '......kkkk......','.....klgggk.....','....klgggggk....','....klgggggk....',
    '....kggggggk....','....kggggggk....','.....kggggk.....','......kkkk......',
  ]),
  flag: pattern([
    '...............l','wwwwwwwwwwwwwwww','.wwwwwwwwgggggww','..wwwwwwggwgwggw',
    '...wwwwwgwwgwwgw','....wwwwgwgggwgw','.....wwwgggwgggw','......wwgggggggw',
    '.......wwwgggwww','........wwwwwwww','.........wwwwwww','..........wwwwww',
    '...........wwwww','............wwww','.............www','..............ww',
    '...............w',
  ]),
  hudCoin: pattern([
    '..aak...','.aaaak..','.aaaak..','.aaaak..',
    '.aaaak..','.aaaak..','.kaakb..','..kkb...',
  ]),

  hill: pattern([
    '................................................................................','................................................................................','................................................................................','................................................................................',
    '................................................................................','................................................................................','................................................................................','................................................................................',
    '................................................................................','................................................................................','................................................................................','................................................................................',
    '................................................................................','.....................................kkkkkk.....................................','..................................kkkggggggkkk..................................','................................kkggggggggggggkk................................',
    '...............................kgggggggggggggkggk...............................','..............................kgggggggggggggkkkggk..............................','.............................kggggggggggggggkkkgggk.............................','............................kgggggggggggggggkkkggggk............................',
    '...........................kgggggggggggggkkgkkkgggggk...........................','..........................kggggggggggggggkkggkgggggggk..........................','.........................kgggggggggggggggkkgggggggggggk.........................','........................kggggggggggggggggkkggggggggggggk........................',
    '.......................kggggggggggggggggggggggggggggggggk.......................','......................kggggggggggggggggggggggggggggggggggk......................','.....................kggggggggggggggggggggggggggggggggggggk.....................','....................kggggggggggggggggggggggggggggggggggggggk....................',
    '...................kggggggggggggggggggggggggggggggggggggggggk...................','..................kggggggggggggggggggggggggggggggggggggggggggk..................','.................kggggggggggggggggggggggggggggggggggggggggggggk.................','................kggggggggggggggggggggggggggggggggggggggggggggggk................',
    '...............kgggggggggggggkgggggggggggggggggggggggkggggggggggk...............','..............kgggggggggggggkkkgggggggggggggggggggggkkkggggggggggk..............','.............kggggggggggggggkkkgggggggggggggggggggggkkkgggggggggggk.............','............kgggggggggggggggkkkgggggggggggggggggggggkkkggggggggggggk............',
    '...........kgggggggggggggkkgkkkggggggggggggggggggkkgkkkgggggggggggggk...........','..........kggggggggggggggkkggkgggggggggggggggggggkkggkgggggggggggggggk..........','.........kgggggggggggggggkkggggggggggggggggggggggkkgggggggggggggggggggk.........','........kggggggggggggggggkkggggggggggggggggggggggkkggggggggggggggggggggk........',
    '.......kggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggk.......','......kggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggk......','.....kggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggk.....','....kggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggk....',
    '...kggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggk...','..kggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggk..','.kggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggk.','kggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggk',
  ]),
  smallHill: pattern([
    '................................................','................................................','................................................','................................................',
    '................................................','................................................','................................................','................................................',
    '................................................','................................................','................................................','................................................',
    '................................................','.....................kkkkkk.....................','..................kkkggggggkkk..................','................kkggggggggggggkk................',
    '...............kgggggggggggggkggk...............','..............kgggggggggggggkkkggk..............','.............kggggggggggggggkkkgggk.............','............kgggggggggggggggkkkggggk............',
    '...........kgggggggggggggkkgkkkgggggk...........','..........kggggggggggggggkkggkgggggggk..........','.........kgggggggggggggggkkgggggggggggk.........','........kggggggggggggggggkkggggggggggggk........',
    '.......kggggggggggggggggggggggggggggggggk.......','......kggggggggggggggggggggggggggggggggggk......','.....kggggggggggggggggggggggggggggggggggggk.....','....kggggggggggggggggggggggggggggggggggggggk....',
    '...kggggggggggggggggggggggggggggggggggggggggk...','..kggggggggggggggggggggggggggggggggggggggggggk..','.kggggggggggggggggggggggggggggggggggggggggggggk.','kggggggggggggggggggggggggggggggggggggggggggggggk',
  ]),
  cloudMiddle: pattern([
    'kk............kk','wwk..........kww','wwwk.......kkwww','wwwk.k....kwwwww',
    'wwwwkwk...kwwwww','wcwwwwwk..kwwwww','wwcwwwwk.kwwwccw','wwwwwwwkkwwwcwww',
    'wwwwwwwwwwwwwwww','wwwwwwwwwwwwwwww','wwwwwwwwwwwwwwww','wwwwwwwwwwwwwwww',
    'wwwwwwwwwwwwwwww','wwwwwwwwwwwwwwww','wwwwwwwwwwwwwwww','wwwwwwwwwwwwwwww',
    'wcwwwwwwwwwwwwww','cwwwwwwwwcwwwwww','ccwwwwcwcccwwwcc','wcccccwwwwcccccc',
    'wwcccwwwwwwwccww','wwwwwwwwkwwwwwwk','kkwwwwkk.kkwwwk.','..kkkk.....kkk..',
  ]),
  bushLeft: pattern([
    '..............kk','.............kll','...........kklll','..........klllll',
    '..........klllll','..........klllll','.........klllggl','........klllglll',
    '.....kkkllllllll','....klllllllllll','...kllllllllllll','...lllllllllllll',
    '.kklllllllllllll','klllllllllllllll','klllllllllllllll','.kllllllllllllll',
  ]),
  bushMiddle: pattern([
    'kk............kk','llk..........kll','lllk.......kklll','lllk.k....klllll',
    'llllklk...klllll','lglllllk..klllll','llgllllk.klllggl','lllllllkklllglll',
    'llllllllllllllll','llllllllllllllll','llllllllllllllll','llllllllllllllll',
    'llllllllllllllll','llllllllllllllll','llllllllllllllll','llllllllllllllll',
  ]),
  bushRight: pattern([
    'kk..............','llk.............','lllk............','lllk.k..........',
    'llllklk.........','lglllllk........','llgllllk........','lllllllk........',
    'llllllllk..k....','llllllllk.klk...','lllllllllkllk...','llllllllllllk.k.',
    'lllllllllllllklk','lllllllllllllllk','lllllllllllllllk','llllllllllllllk.',
  ]),
  pipeTop: pattern([
    'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk','kllllllllllllllllllllllllllllllk','kgggggllllllgggggggggggggggggggk','klllggllllllgllgggggggggglglgllk',
    'klllggllllllgllggggggggggglglllk','klllggllllllgllgggggggggglglgllk','klllggllllllgllggggggggggglglllk','klllggllllllgllgggggggggglglgllk',
    'klllggllllllgllggggggggggglglllk','klllggllllllgllgggggggggglglgllk','klllggllllllgllggggggggggglglllk','klllggllllllgllgggggggggglglgllk',
    'klllggllllllgllggggggggggglglllk','klllggllllllgllgggggggggglglgllk','kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk','..kkkkkkkkkkkkkkkkkkkkkkkkkkkk..',
  ]),
  pipeBody: pattern([
    '..klllgglllllgllgggggggglglllk..','..klllgglllllgllggggggggglgllk..',
  ]),
  pipeLeft: pattern([
    'dddddddddddddddkkkkkkkkkkkkkkkkkkkdlllgg','dlllllllllllllddddddddddddddddddddddllgg','dlllllllllllllddlllllllllllllllllllldlgg','dlllllllllllllddlllllllllllllllllllldlgg',
    'dlllllllllllllddlllllllllllllllllllldlgg','dgggggggggggggddllllllllllllllllllllldgg','dgggggggggggggddgggggggggggggggggggggdgg','dlllllllllllllddgggggggggggggggggggggdgg',
    'dlllllllllllllddllllllllllllllllllllldgg','dlllllllllllllddllllllllllllllllllllldgg','dlllllllllllllddlllllllllllllllllllllldg','dlllllllllllllddlllllllllllllllllllllldg',
    'dgggggggggggggddlllllllllllllllllllllldg','dlllllllllllllddggggggggggggggggggggggdg','dlllllllllllllddlllllllllllllllllllllldg','dlllllllllllllddlllllllllllllllllllllldg',
    'dlllllllllllllddggggggggggggggggggggggdg','dgggggggggggggddggggggggggggggggggggggdg','dgggggggggggggddggggggggggggggggggggggdg','dgggggggggggggddggggggggggggggggggggggdg',
    'dgggggggggggggddggggggggggggggggggggggdg','dgggggggggggggddggggggggggggggggggggggdg','dgggggggggggggddgggggggggggggggggggggdgg','dgggggggggggggddgggggggggggggggggggggdgg',
    'dgggggggggggggddgggggggggggggggggggggdgg','dgggggggggggggddglglglglglglglglglglgdgg','dglglglglglglgddlglglglglglglglglglgldgg','dlglglglglglglddglglglglglglglglglgldlgg',
    'dglglglglglglgddlllllllllllllllllllldlgg','dlllllllllllllddlllllllllllllllllllldlgg','dlllllllllllllddddddddddddddddddddddllgg','dddddddddddddddkkkkkkkkkkkkkkkkkkkdlllgg',
  ]),
  pipeVertical: pattern([
    'kkdlllgglllllgllgggggggglgllldkk','kkdlllgglllllgllggggggggglglldkk',
  ]),
};
const CASTLE_TILES = [
  pattern([
    'ssss.......sssss','bbbs.......sbbbb','bbbs.......sbbbb','bbbs.......sbbbb',
    'bbbs.......sbbbb','bbbs.......sbbbb','bbbs.......sbbbb','kkkssssssssskkkk',
    'bbbbbbbkbbbbbbbk','bbbbbbbkbbbbbbbk','bbbbbbbkbbbbbbbk','kkkkkkkkkkkkkkkk',
    'bbbkbbbbbbbkbbbb','bbbkbbbbbbbkbbbb','bbbkbbbbbbbkbbbb','kkkkkkkkkkkkkkkk',
  ]),
  pattern([
    'bbbbbbbkkkkkkkkk','bbbbbbbkkkkkkkkk','bbbbbbbkkkkkkkkk','kkkkkkkkkkkkkkkk',
    'bbbkbbbbkkkkkkkk','bbbkbbbbkkkkkkkk','bbbkbbbbkkkkkkkk','kkkkkkkkkkkkkkkk',
    'bbbbbbbkkkkkkkkk','bbbbbbbkkkkkkkkk','bbbbbbbkkkkkkkkk','kkkkkkkkkkkkkkkk',
    'bbbkbbbbkkkkkkkk','bbbkbbbbkkkkkkkk','bbbkbbbbkkkkkkkk','kkkkkkkkkkkkkkkk',
  ]),
  pattern([
    'bbbbbbbkbbbbbbbk','bbbbbbbkbbbbbbbk','bbbbbbbkbbbbbbbk','kkkkkkkkkkkkkkkk',
    'bbbkbbbbbbbkbbbb','bbbkbbbbbbbkbbbb','bbbkbbbbbbbkbbbb','kkkkkkkkkkkkkkkk',
    'bbbbbbbkbbbbbbbk','bbbbbbbkbbbbbbbk','bbbbbbbkbbbbbbbk','kkkkkkkkkkkkkkkk',
    'bbbkbbbbbbbkbbbb','bbbkbbbbbbbkbbbb','bbbkbbbbbbbkbbbb','kkkkkkkkkkkkkkkk',
  ]),
  pattern([
    'kkkkkkkkbbbbbbbk','kkkkkkkkbbbbbbbk','kkkkkkkkbbbbbbbk','kkkkkkkkkkkkkkkk',
    'kkkkkkkkbbbkbbbb','kkkkkkkkbbbkbbbb','kkkkkkkkbbbkbbbb','kkkkkkkkkkkkkkkk',
    'kkkkkkkkbbbbbbbk','kkkkkkkkbbbbbbbk','kkkkkkkkbbbbbbbk','kkkkkkkkkkkkkkkk',
    'kkkkkkkkbbbkbbbb','kkkkkkkkbbbkbbbb','kkkkkkkkbbbkbbbb','kkkkkkkkkkkkkkkk',
  ]),
  pattern([
    'ssssbbbkbbbsssss','bbbsbbbkbbbsbbbb','bbbsbbbkbbbsbbbb','bbbskkkkkkksbbbb',
    'bbbsbbbbbbbsbbbb','bbbsbbbbbbbsbbbb','bbbsbbbbbbbsbbbb','kkkssssssssskkkk',
    'bbbbbbbkbbbbbbbk','bbbbbbbkbbbbbbbk','bbbbbbbkbbbbbbbk','kkkkkkkkkkkkkkkk',
    'bbbkbbbbbbbkbbbb','bbbkbbbbbbbkbbbb','bbbkbbbbbbbkbbbb','kkkkkkkkkkkkkkkk',
  ]),
  pattern([
    'bbbbbkkkkkkbbbbk','bbbkkkkkkkkkkbbk','bbkkkkkkkkkkkkbk','kkkkkkkkkkkkkkkk',
    'bkkkkkkkkkkkkkkb','bkkkkkkkkkkkkkkb','kkkkkkkkkkkkkkkk','kkkkkkkkkkkkkkkk',
    'kkkkkkkkkkkkkkkk','kkkkkkkkkkkkkkkk','kkkkkkkkkkkkkkkk','kkkkkkkkkkkkkkkk',
    'kkkkkkkkkkkkkkkk','kkkkkkkkkkkkkkkk','kkkkkkkkkkkkkkkk','kkkkkkkkkkkkkkkk',
  ]),
  pattern([
    'kkkkkkkkkkkkkkkk','kkkkkkkkkkkkkkkk','kkkkkkkkkkkkkkkk','kkkkkkkkkkkkkkkk',
    'kkkkkkkkkkkkkkkk','kkkkkkkkkkkkkkkk','kkkkkkkkkkkkkkkk','kkkkkkkkkkkkkkkk',
    'kkkkkkkkkkkkkkkk','kkkkkkkkkkkkkkkk','kkkkkkkkkkkkkkkk','kkkkkkkkkkkkkkkk',
    'kkkkkkkkkkkkkkkk','kkkkkkkkkkkkkkkk','kkkkkkkkkkkkkkkk','kkkkkkkkkkkkkkkk',
  ]),
];
const CASTLE_LAYOUT = [[-1, 0, 0, 0, -1], [-1, 1, 2, 3, -1], [0, 4, 4, 4, 0], [2, 2, 5, 2, 2], [2, 2, 6, 2, 2]];

const GLYPHS = {
  '0':['011110','110011','110111','111011','110011','110011','011110'],
  '1':['001100','011100','001100','001100','001100','001100','111111'],
  '2':['011110','110011','000011','001110','011000','110000','111111'],
  '3':['011110','110011','000011','001110','000011','110011','011110'],
  '4':['000110','001110','011110','110110','111111','000110','000110'],
  '5':['111111','110000','111110','000011','000011','110011','011110'],
  '6':['001110','011000','110000','111110','110011','110011','011110'],
  '7':['111111','110011','000110','001100','011000','011000','011000'],
  '8':['011110','110011','110011','011110','110011','110011','011110'],
  '9':['011110','110011','110011','011111','000011','000110','011100'],
  A:['001100','011110','110011','110011','111111','110011','110011'],
  C:['011110','110011','110000','110000','110000','110011','011110'],
  D:['111100','110110','110011','110011','110011','110110','111100'],
  E:['111111','110000','110000','111110','110000','110000','111111'],
  I:['111111','001100','001100','001100','001100','001100','111111'],
  L:['110000','110000','110000','110000','110000','110000','111111'],
  M:['110011','111111','111111','110011','110011','110011','110011'],
  O:['011110','110011','110011','110011','110011','110011','011110'],
  R:['111110','110011','110011','111110','111100','110110','110011'],
  T:['111111','001100','001100','001100','001100','001100','001100'],
  W:['110011','110011','110011','110011','111111','111111','110011'],
  X:['000000','110011','011110','001100','011110','110011','000000'],
  '-':['000000','000000','000000','111111','000000','000000','000000'],
};
const FONT = Object.fromEntries(Object.entries(GLYPHS).map(([key, rows]) => [key, pattern(rows.map(r => r.replaceAll('0', '.').replaceAll('1', 'w')))]));

Object.assign(FONT, {
  'M': pattern([
    'ww...ww.','www.www.','wwwwwww.','wwwwwww.',
    'ww.w.ww.','ww...ww.','ww...ww.','........',
  ]),
  'A': pattern([
    '..www...','.ww.ww..','ww...ww.','ww...ww.',
    'wwwwwww.','ww...ww.','ww...ww.','........',
  ]),
  'R': pattern([
    'wwwwww..','ww...ww.','ww...ww.','ww..www.',
    'wwwww...','ww.www..','ww..www.','........',
  ]),
  'I': pattern([
    '.wwwwww.','...ww...','...ww...','...ww...',
    '...ww...','...ww...','.wwwwww.','........',
  ]),
  'O': pattern([
    '.wwwww..','ww...ww.','ww...ww.','ww...ww.',
    'ww...ww.','ww...ww.','.wwwww..','........',
  ]),
  'W': pattern([
    'ww...ww.','ww...ww.','ww.w.ww.','wwwwwww.',
    'wwwwwww.','www.www.','ww...ww.','........',
  ]),
  'L': pattern([
    '.ww.....','.ww.....','.ww.....','.ww.....',
    '.ww.....','.ww.....','.wwwwww.','........',
  ]),
  'D': pattern([
    'wwwww...','ww..ww..','ww...ww.','ww...ww.',
    'ww...ww.','ww..ww..','wwwww...','........',
  ]),
  'T': pattern([
    '.wwwwww.','...ww...','...ww...','...ww...',
    '...ww...','...ww...','...ww...','........',
  ]),
  'E': pattern([
    'wwwwwww.','ww......','ww......','wwwwww..',
    'ww......','ww......','wwwwwww.','........',
  ]),
  '0': pattern([
    '..www...','.w..ww..','ww...ww.','ww...ww.',
    'ww...ww.','.ww..w..','..www...','........',
  ]),
  '4': pattern([
    '...www..','..wwww..','.ww.ww..','ww..ww..',
    'wwwwwww.','....ww..','....ww..','........',
  ]),
  '2': pattern([
    '.wwwww..','ww...ww.','....www.','..wwww..',
    '.wwww...','www.....','wwwwwww.','........',
  ]),
  '5': pattern([
    'wwwwww..','ww......','wwwwww..','.....ww.',
    '.....ww.','ww...ww.','.wwwww..','........',
  ]),
  '1': pattern([
    '...ww...','..www...','...ww...','...ww...',
    '...ww...','...ww...','.wwwwww.','........',
  ]),
  '-': pattern([
    '........','........','........','.wwwwww.',
    '.wwwwww.','........','........','........',
  ]),
  '8': pattern([
    '.wwwww..','ww...ww.','ww...ww.','.wwwww..',
    'ww...ww.','ww...ww.','.wwwww..','........',
  ]),
  '3': pattern([
    '.wwwwww.','....ww..','...ww...','..wwww..',
    '.....ww.','ww...ww.','.wwwww..','........',
  ]),
  'X': pattern([
    '........','........','.w...w..','..w.w...',
    '...w....','..w.w...','.w...w..','........',
  ]),
});

const CAMPAIGN = Object.fromEntries(Object.entries(CAMPAIGN_ROWS).map(([name, rows]) => [name, pattern(rows)]));
const FIRE_ORB = pattern(['..aaaa..','.arrrra.','arwwrraa','arwwwrra','arwwwrra','aarrwrra','.arrrra.','..aaaa..']);
const CANNON = pattern(['kkkkkkkkkkkkkkkk','wwwwwwwwwwwwwwww','kllllllllllllllk','kllkkkkkkkkkkllk','kllkwwwwwwwwkllk','kllkwkkkkkkwkllk','kllkwkkkkkkwkllk','kllkwwwwwwwwkllk','kllkkkkkkkkkkllk','kllllllllllllllk','kkllkkllllkkllkk','kkllkkllllkkllkk','kkllkkllllkkllkk','kkllkkllllkkllkk','kkllkkkkkkllkkkk','kkkkkkkkkkkkkkkk']);
const themeOf = game => game.world.theme ?? game.area;
function terrainPalette(game) {
  if (game.world.palette === 'gray' || themeOf(game) === 'castle')
    return { k: '#000000', b: '#7c7c7c', s: '#fcfcfc', a: '#bcbcbc', w: '#fcfcfc' };
  if (themeOf(game) === 'underground') return COLORS.underground;
  if (themeOf(game) === 'underwater') return { k: '#000000', b: '#00a800', s: '#b8f818', a: '#fc9838', w: '#fcfcfc' };
  if (game.world.palette === 'snow') return { ...COLORS.terrain, s: '#fcfcfc' };
  return COLORS.terrain;
}
function sceneryPalette(game) {
  if (game.world.palette === 'gray') return { ...COLORS.scenery, g: '#7c7c7c', l: '#fcfcfc' };
  if (game.world.palette === 'snow') return { ...COLORS.scenery, g: '#fcfcfc', l: '#fcfcfc' };
  return COLORS.scenery;
}

function draw(ctx, sprite, x, y, palette, flip = false, scale = 1) {
  x = Math.floor(x); y = Math.floor(y);
  for (const [sx, sy, width, key] of sprite.spans) {
    ctx.fillStyle = palette[key] || '#000000';
    ctx.fillRect(x + (flip ? sprite.w - sx - width : sx) * scale, y + sy * scale, width * scale, scale);
  }
}

function text(ctx, value, x, y) {
  for (const letter of String(value).toUpperCase()) {
    if (FONT[letter]) draw(ctx, FONT[letter], x, y, COLORS.mario);
    x += 8;
  }
}

function scenery(ctx, game, camera) {
  if (game.world.scenery) return;
  const theme = themeOf(game);
  if (theme !== 'overworld' && theme !== 'sky') return;
  const palette = sceneryPalette(game);
  for (let section = Math.floor((camera - 192) / 768); section <= Math.floor((camera + WIDTH) / 768); section++) {
    const base = section * 768 - camera;
    if (theme === 'overworld') {
      draw(ctx, SCENERY.hill, base, 160, palette);
      draw(ctx, SCENERY.smallHill, base + 256, 176, palette);
    }
    for (const [offset, y, count] of [[136, 48, 1], [312, 32, 1], [440, 48, 3], [584, 32, 2]]) {
      ctx.save(); ctx.beginPath(); ctx.rect(base + offset, y, 16, 24); ctx.clip();
      draw(ctx, SPRITES.cloud, base + offset, y, palette); ctx.restore();
      for (let i = 1; i < count; i++) draw(ctx, SCENERY.cloudMiddle, base + offset + i * 16, y, palette);
      ctx.save(); ctx.beginPath(); ctx.rect(base + offset + count * 16, y, 16, 24); ctx.clip();
      draw(ctx, SPRITES.cloud, base + offset + (count - 1) * 16, y, palette); ctx.restore();
    }
    if (theme === 'overworld') for (const [offset, count] of [[184, 3], [376, 1], [664, 2]]) {
      draw(ctx, SCENERY.bushLeft, base + offset, 192, palette);
      for (let i = 1; i < count; i++) draw(ctx, SCENERY.bushMiddle, base + offset + i * 16, 192, palette);
      draw(ctx, SCENERY.bushRight, base + offset + count * 16, 192, palette);
    }
  }
}

function pipe(ctx, tile, camera, palette = COLORS.scenery) {
  const x = Math.floor(tile.x - camera), y = Math.floor(tile.y);
  const width = tile.direction === 'left' && tile.w > 16 ? Math.max(tile.w, SCENERY.pipeLeft.w) : tile.w;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, width, tile.h); ctx.clip();
  if (tile.direction === 'left') {
    draw(ctx, SCENERY.pipeLeft, x, y, palette);
  } else {
    const capped = tile.direction !== 'vertical';
    if (capped) draw(ctx, SCENERY.pipeTop, x, y, palette);
    for (let row = capped ? 16 : 0; row < tile.h; row += 2)
      draw(ctx, capped ? SCENERY.pipeBody : SCENERY.pipeVertical, x, y + row, palette);
  }
  ctx.restore();
}

function castle(ctx, tile, camera, palette) {
  const x = Math.floor(tile.x - camera), y = Math.floor(tile.y);
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, tile.w, tile.h); ctx.clip();
  for (let row = 0; row < CASTLE_LAYOUT.length; row++) {
    for (let column = 0; column < CASTLE_LAYOUT[row].length; column++) {
      const sprite = CASTLE_TILES[CASTLE_LAYOUT[row][column]];
      if (sprite) draw(ctx, sprite, x + column * 16, y + row * 16, palette);
    }
  }
  ctx.restore();
}

function terrain(ctx, game, camera, foreground) {
  const palette = terrainPalette(game);
  for (const tile of game.world.tiles) {
    if (tile.hidden && !tile.used) continue;
    if (tile.x + tile.w < camera || tile.x > camera + WIDTH) continue;
    if ((tile.kind === 'pipe') !== foreground) continue;
    if (tile.kind === 'pipe') {
      if (tile.direction !== 'left') pipe(ctx, tile, camera, game.world.palette === 'gray' || themeOf(game) === 'castle' ? { ...COLORS.scenery, g: '#7c7c7c', l: '#fcfcfc' } : COLORS.scenery);
      continue;
    }
    if (tile.kind === 'castle') { castle(ctx, tile, camera, palette); continue; }
    if (tile.kind === 'spring') {
      const compression = tile.compression ?? 0;
      const height = Math.max(4, tile.h - compression), x = Math.floor(tile.x - camera), y = Math.floor(tile.y + compression);
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, tile.w, height); ctx.clip();
      draw(ctx, CAMPAIGN.bridge, x, y, CAMPAIGN_PALETTE);
      ctx.fillStyle = '#fcfcfc';
      for (let sy = 4; sy < height - 3; sy++) {
        const dx = Math.abs((sy % 8) - 4);
        ctx.fillRect(x + 3 + dx, y + sy, 2, 1); ctx.fillRect(x + 11 - dx, y + sy, 2, 1);
      }
      ctx.fillStyle = '#d82800'; ctx.fillRect(x, y + height - 3, tile.w, 3); ctx.restore();
      continue;
    }
    if (tile.kind === 'flagpole') {
      const x = Math.floor(tile.x - camera), y = Math.floor(tile.y);
      ctx.fillStyle = COLORS.scenery.l; ctx.fillRect(x + 7, y + 16, 2, Math.max(0, tile.h - 16));
      draw(ctx, SCENERY.flagCap, x, y + 8, COLORS.scenery);
      const fy = Math.floor(game.finish?.flagY ?? tile.flagY ?? game.flagY ?? y + 16);
      draw(ctx, SCENERY.flag, x - 8, fy, COLORS.scenery);
      continue;
    }
    const name = tile.used ? 'used' : tile.kind === 'platform' && tile.style ? tile.style : tile.kind;
    const sprite = CAMPAIGN[name] || SPRITES[name === 'brick' && themeOf(game) === 'underground' ? 'undergroundBrick' : name];
    if (!sprite) continue;
    const y = Math.floor(tile.y - (tile.bump > 0 ? Math.sin((12 - tile.bump) * Math.PI / 12) * 4 : 0));
    ctx.save(); ctx.beginPath(); ctx.rect(Math.floor(tile.x - camera), y, tile.w, tile.h); ctx.clip();
    const first = Math.max(0, Math.floor((camera - tile.x) / 16) * 16);
    let colors = CAMPAIGN[name] ? { ...CAMPAIGN_PALETTE, ...(game.world.palette === 'gray' ? { g: '#7c7c7c', r: '#bcbcbc', a: '#fcfcfc', b: '#7c7c7c', s: '#bcbcbc' } : game.world.palette === 'snow' ? { g: '#fcfcfc' } : {}) } : palette;
    if (name === 'question') {
      const shade = ['#fc9838', '#c84c0c', '#883000', '#c84c0c'][Math.floor(game.frame / 8) % 4];
      colors = { k: '#000000', b: '#c84c0c', a: shade };
    }
    if (name === 'used') colors = palette;
    for (let ty = 0; ty < tile.h; ty += sprite.h) {
      for (let tx = first; tx < tile.w && tile.x + tx < camera + WIDTH; tx += sprite.w)
        draw(ctx, sprite, tile.x + tx - camera, y + ty, colors);
    }
    ctx.restore();
  }
  // The elbow overlaps the vertical pipe visually, without widening its collision box.
  if (foreground) for (const tile of game.world.tiles) {
    if (tile.kind === 'pipe' && tile.direction === 'left' && !(tile.hidden && !tile.used)
      && tile.x + SCENERY.pipeLeft.w >= camera && tile.x <= camera + WIDTH) pipe(ctx, tile, camera, game.world.palette === 'gray' || themeOf(game) === 'castle' ? { ...COLORS.scenery, g: '#7c7c7c', l: '#fcfcfc' } : COLORS.scenery);
  }
}

function player(ctx, game, camera) {
  const p = game.player;
  if (p.hidden || (p.hurtTimer > 0 && Math.floor(game.frame / 4) % 2)) return;
  const power = game.transform ? (p.posePower ?? p.power) : p.power;
  let pose = 'idle';
  if (game.status === 'dying' || game.status === 'gameover') pose = 'death';
  else if (p.climbing) pose = 'climb' + Math.floor(game.frame / 8) % 2;
  else if (p.swimming) pose = 'swim' + Math.floor(game.frame / 8) % 2;
  else if (p.crouching || (power !== 'small' && p.h <= 24)) pose = 'crouch';
  else if (!p.grounded) pose = 'jump';
  else if (p.skidding || (Math.abs(p.vx) > 0.5 && Math.sign(p.vx) !== p.facing)) pose = 'skid';
  else if (Math.abs(p.vx) > 0.1) pose = 'run' + (Math.floor(game.frame / (Math.abs(p.vx) > 2 ? 4 : 7)) % 3);
  const sprites = power === 'small' || pose === 'death' ? MARIO_SMALL : MARIO_BIG;
  const sprite = CAMPAIGN[(power === 'small' ? 'small' : 'big') + pose] || sprites[pose] || sprites.idle;
  let palette = power === 'fire' ? COLORS.fire : COLORS.mario;
  if (game.transform?.kind === 'fire') {
    palette = [COLORS.mario, COLORS.fire, { r: '#00a800', b: '#008088', s: '#fcfcfc' }, { r: '#fc9838', b: '#d82800', s: '#fcfcfc' }][(p.palette ?? 0) % 4];
  }
  if (p.invincible > 0) {
    palette = [COLORS.fire, { r: '#b8f818', b: '#008800', s: '#fcfcfc' },
      { r: '#3cbcfc', b: '#2038ec', s: '#fcfcfc' }, COLORS.mario][Math.floor(game.frame / 4) % 4];
  }
  draw(ctx, sprite, p.x + (p.w - 16) / 2 - camera, p.y + p.h - sprite.h, palette, p.facing < 0);
}

function actors(ctx, game, camera) {
  for (const item of game.items) {
    if (item.x + item.w < camera || item.x > camera + WIDTH) continue;
    if (item.emergeState !== undefined && item.emergeState < 6) continue;
    const sprite = SPRITES[item.type];
    if (!sprite) continue;
    let palette = { ...COLORS.actor, c: themeOf(game) === 'underground' ? '#008088' : '#000000' };
    if (item.type === 'star') palette = { ...palette, a: ['#fc9838', '#fcfcfc', '#80d010'][Math.floor(game.frame / 4) % 3] };
    const x = item.x + (item.w - 16) / 2 - camera, y = item.y + item.h - 16;
    const emerging = item.emerge > 0 && Number.isFinite(item.originY);
    if (emerging) {
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, WIDTH, Math.max(0, Math.floor(item.originY))); ctx.clip();
    }
    if (item.type === 'coin' && Math.floor(game.frame / 6) % 4 === 2) {
      ctx.fillStyle = '#fc9838'; ctx.fillRect(Math.floor(x + 7), Math.floor(y + 1), 2, 14);
    } else draw(ctx, sprite, x, y, palette);
    if (emerging) ctx.restore();
  }
  for (const enemy of game.enemies) {
    if (enemy.type === 'podoboo' && enemy.phase !== 'jump') continue;
    if (!enemy.alive && !enemy.squashed && !(enemy.squashTimer > 0)) continue;
    if (enemy.x + enemy.w < camera || enemy.x > camera + WIDTH) continue;
    const squashed = enemy.squashed || enemy.squashTimer > 0;
    const walking = enemy.alive && !squashed && Math.floor(game.frame / 8) % 2 === 1;
    const name = squashed ? 'squashed' : walking && ['goomba', 'koopa'].includes(enemy.type) ? enemy.type + 'Step' : enemy.type;
    const sprite = enemy.type === 'shell' && enemy.shellType === 'beetle' ? CAMPAIGN.beetleShell
      : CAMPAIGN[enemy.type + (walking ? 1 : 0)] || SPRITES[name];
    if (!sprite) continue;
    let palette = CAMPAIGN[enemy.type + '0'] || enemy.shellType === 'beetle' ? CAMPAIGN_PALETTE : enemy.type === 'goomba' ? COLORS.enemy : COLORS.actor;
    if (enemy.type === 'beetle' || enemy.shellType === 'beetle') {
      if (themeOf(game) === 'castle' || game.world.palette === 'gray') palette = { ...palette, k: '#7c7c7c', b: '#bcbcbc', s: '#fcfcfc' };
      else if (themeOf(game) === 'underground' || themeOf(game) === 'underwater') palette = { ...palette, k: '#004058', b: '#008088', s: '#3cbcfc' };
    }
    if (['red', 'redKoopa', 'redParatroopa'].includes(enemy.variant)) palette = { ...palette, g: '#d82800' };
    if (enemy.type === 'cheepcheep') {
      if (enemy.variant === 'green') palette = { ...palette, r: '#00a800' };
      else if (enemy.variant === 'grayCheep') palette = { ...palette, r: '#bcbcbc' };
    }
    const x = enemy.x + (enemy.w - sprite.w) / 2 - camera, y = enemy.y + enemy.h - sprite.h;
    const flip = enemy.type !== 'goomba' && (enemy.facing ?? Math.sign(enemy.vx)) > 0;
    draw(ctx, sprite, x, y, palette, flip);
    if (enemy.type === 'koopa' && (enemy.winged ?? (enemy.variant === 'paratroopa' || ['fly', 'flying', 'horizontal', 'vertical', 'hop'].includes(enemy.motion)))) {
      draw(ctx, CAMPAIGN['wing' + (walking ? 1 : 0)], x + (flip ? -4 : 8), y + 2, CAMPAIGN_PALETTE, flip);
    }
  }
  for (const ball of game.fireballs) draw(ctx, SPRITES.fireball, ball.x - camera, ball.y, COLORS.tile, Math.floor(game.frame / 3) % 2 === 1);
  for (const projectile of game.projectiles || []) {
    const sprite = CAMPAIGN[projectile.type];
    if (!sprite || projectile.x + projectile.w < camera || projectile.x > camera + WIDTH) continue;
    const x = projectile.x + projectile.w / 2 - camera, y = projectile.y + projectile.h / 2;
    ctx.save(); ctx.translate(Math.floor(x), Math.floor(y));
    if (projectile.type === 'hammer') ctx.rotate(projectile.angle ?? game.frame * .3);
    draw(ctx, sprite, -sprite.w / 2, -sprite.h / 2, CAMPAIGN_PALETTE, projectile.vx > 0);
    ctx.restore();
  }
}

function effects(ctx, game, camera) {
  for (const effect of game.effects) {
    const x = Math.floor(effect.x - camera), y = Math.floor(effect.y);
    if (effect.type === 'score' || effect.type === 'text') text(ctx, effect.text ?? effect.value ?? '', x, y);
    else if (effect.type === 'coin') draw(ctx, SPRITES.coin, x, y, { ...COLORS.actor, c: themeOf(game) === 'underground' ? '#008088' : '#000000' });
    else if (effect.type === 'brick' || effect.type === 'debris' || effect.type === 'break') {
      ctx.fillStyle = '#c84c0c'; ctx.fillRect(x, y, 6, 6);
      ctx.fillStyle = '#fca044'; ctx.fillRect(x, y, 5, 1);
      ctx.fillStyle = '#000000'; ctx.fillRect(x + 5, y + 1, 1, 5);
    } else if (['goomba', 'koopa', 'shell'].includes(effect.type)) {
      const sprite = effect.flattened ? SPRITES.squashed : SPRITES[effect.type];
      ctx.save();
      if (effect.flipped) { ctx.translate(x, y + sprite.h); ctx.scale(1, -1); }
      draw(ctx, sprite, effect.flipped ? 0 : x, effect.flipped ? 0 : y,
        effect.type === 'goomba' ? COLORS.enemy : COLORS.actor);
      ctx.restore();
    } else if (effect.type === 'squashed') draw(ctx, SPRITES.squashed, x, y, COLORS.enemy);
    else if (effect.type === 'firework' || effect.type === 'explosion') {
      const radius = 3 + game.frame % 4;
      ctx.fillStyle = game.frame % 2 ? '#fcfcfc' : '#fca044';
      for (let d = -1; d <= 1; d++) for (let e = -1; e <= 1; e++)
        if (d || e) ctx.fillRect(x + d * radius, y + e * radius, 3, 3);
    }
  }
}

function repeat(ctx, sprite, rect, camera, palette) {
  const x = Math.floor(rect.x - camera), y = Math.floor(rect.y);
  if (x + rect.w < 0 || x > WIDTH) return;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, rect.w, rect.h); ctx.clip();
  const first = Math.max(0, Math.floor(-x / sprite.w) * sprite.w);
  for (let sy = 0; sy < rect.h; sy += sprite.h)
    for (let sx = first; sx < rect.w && x + sx < WIDTH; sx += sprite.w)
      draw(ctx, sprite, x + sx, y + sy, palette);
  ctx.restore();
}

const DECOR = {
  'tree-trunk': pattern(['abbbbbba','abbbbbba','abbbbbba','abbbbbba','abbabbaa','abbabbaa','abbabbaa','abbbbbba']),
  'mushroom-stem': pattern(['wwwwwwwwwwwwwwww','wssssssssssssssw','wssssssssssssssw','wssssssssssssssw','wssssssssssssssw','wssssssssssssssw','wssssssssssssssw','wssssssssssssssw']),
  'bridge-rail': pattern(['wwwwwwwwwwwwwwww','wwwwwwwwwwwwwwww','w...w...w...w...','w...w...w...w...','w...w...w...w...','w...w...w...w...','w...w...w...w...','w...w...w...w...','w...w...w...w...','w...w...w...w...','w...w...w...w...','w...w...w...w...','w...w...w...w...','w...w...w...w...','w...w...w...w...','w...w...w...w...']),
  chain: pattern(['..ww....','.waaw...','w....w..','w....w..','.waaw...','..ww....','...ww...','..waaw..']),
  endlessRope: CAMPAIGN.rope,
  balanceRope: CAMPAIGN.rope,
  pulleyRope: pattern(['wwwwwwww','aaaaaaaa'])
};
const BACKDROP_TREE = pattern([
  '......gggg......','.....gggggg.....','....gggggggg....','...gggggggggg...',
  '..gggggggggggg..','.gggggggggggggg.','gggggggggggggggg','gggggggggggggggg',
  '.gggggggggggggg.','..gggggggggggg..','...gggggggggg...','....gggggggg....',
  '.....gggggg.....','......gggg......','.......bb.......','.......bb.......',
]);
const BACKDROP_FENCE = pattern([
  '..s......s......','.sss....sss.....','.sbs....sbs.....','.sbs....sbs.....',
  'ssssssssssssssss','bbbbbbbbbbbbbbbb','.sbs....sbs.....','.sbs....sbs.....',
  '.sbs....sbs.....','.sbs....sbs.....','ssssssssssssssss','bbbbbbbbbbbbbbbb',
  '.sbs....sbs.....','.sbs....sbs.....','.sbs....sbs.....','.sbs....sbs.....',
]);
const HILL_EDGE = pattern(Array.from({ length: 48 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => y < 16 - x ? '.' : y === 16 - x ? 'k' : 'g').join('')));
const HILL_MIDDLE = pattern(Array.from({ length: 48 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => {
    const top = Math.max(0, 4 - Math.min(x, 15 - x));
    return y < top ? '.' : y === top ? 'k' : (x === 5 || x === 10) && y > 14 && y < 18 ? 'k' : 'g';
  }).join('')));
function backdrop(ctx, piece, game, camera) {
  const x = Math.floor(piece.x - camera), y = Math.floor(piece.y), palette = sceneryPalette(game);
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, piece.w, piece.h); ctx.clip();
  if (piece.kind === 'cloud') {
    draw(ctx, SPRITES.cloud, x + (piece.part === 'left' ? 8 : piece.part === 'right' ? -24 : -8), y, palette);
  } else if (piece.kind === 'bush') {
    draw(ctx, SCENERY[piece.part === 'left' ? 'bushLeft' : piece.part === 'right' ? 'bushRight' : 'bushMiddle'], x, y, palette);
  } else if (piece.kind === 'hill') {
    draw(ctx, piece.part === 'middle' ? HILL_MIDDLE : HILL_EDGE, x, y, palette, piece.part === 'right');
  } else if (piece.kind === 'tree') {
    const crownHeight = piece.part === 'short' ? 16 : 32;
    const colors = { ...palette, b: game.world.palette === 'gray' ? '#7c7c7c' : '#c84c0c' };
    draw(ctx, BACKDROP_TREE, x, y, colors);
    if (crownHeight === 32) draw(ctx, BACKDROP_TREE, x, y + 12, colors);
    ctx.fillStyle = colors.b; ctx.fillRect(x + 7, y + crownHeight, 2, piece.h - crownHeight);
  } else draw(ctx, BACKDROP_FENCE, x, y, terrainPalette(game));
  ctx.restore();
}
function decorations(ctx, game, camera) {
  for (const decoration of game.world.scenery || []) {
    if (decoration.x + decoration.w < camera || decoration.x > camera + WIDTH) continue;
    if (['cloud', 'bush', 'hill', 'tree', 'fence'].includes(decoration.kind)) {
      backdrop(ctx, decoration, game, camera);
      continue;
    }
    const sprite = decoration.kind === 'wall' ? SPRITES.brick : DECOR[decoration.kind];
    if (sprite) repeat(ctx, sprite, decoration, camera, decoration.kind === 'wall' ? terrainPalette(game) : game.world.palette === 'gray' ? { ...CAMPAIGN_PALETTE, a: '#fcfcfc', b: '#7c7c7c', s: '#bcbcbc' } : CAMPAIGN_PALETTE);
  }
}

function mechanisms(ctx, game, camera) {
  for (const platform of game.world.platforms || []) {
    if (Number.isFinite(platform.ropeY)) repeat(ctx, CAMPAIGN.rope,
      { x: platform.x + platform.w / 2 - 2, y: platform.ropeY, w: 4, h: Math.max(0, platform.y - platform.ropeY) }, camera, CAMPAIGN_PALETTE);
    repeat(ctx, CAMPAIGN.platform, platform, camera, CAMPAIGN_PALETTE);
  }
  for (const vine of game.vines || []) repeat(ctx, CAMPAIGN.vine, vine, camera, CAMPAIGN_PALETTE);
  for (const hazard of game.world.hazards || []) {
    if (hazard.type === 'firebar') {
      for (let i = 0; i < hazard.length; i++) {
        const x = hazard.x + Math.cos(hazard.angle) * (hazard.spacing ?? 8) * i - camera;
        const y = hazard.y + Math.sin(hazard.angle) * (hazard.spacing ?? 8) * i;
        draw(ctx, FIRE_ORB, x - 4, y - 4, CAMPAIGN_PALETTE, Math.floor(game.frame / 4) % 2 === 1);
      }
    } else if (hazard.type === 'lava') {
      const x = Math.floor(hazard.x - camera), y = Math.floor(hazard.y);
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, hazard.w, hazard.h); ctx.clip();
      ctx.fillStyle = '#d82800'; ctx.fillRect(x, y + 4, hazard.w, hazard.h);
      for (let dx = Math.max(0, Math.floor(-x / 8) * 8); dx < hazard.w && x + dx < WIDTH; dx += 8) {
        ctx.fillStyle = '#fcfcfc';
        const phase = Math.floor(game.frame / 8) % 2;
        for (let p = 0; p < 8; p++) ctx.fillRect(x + dx + p, y + Math.abs(p - (phase ? 5 : 2)), 1, 2);
      }
      ctx.restore();
    } else if (hazard.type === 'cannon') repeat(ctx, CANNON, hazard, camera, CAMPAIGN_PALETTE);
  }
}

function goal(ctx, game, camera) {
  const g = game.world.goal;
  if (!g || !['axe', 'ending'].includes(g.kind)) return;
  if (!game.finish) draw(ctx, CAMPAIGN.axe, g.x - camera, g.y, CAMPAIGN_PALETTE);
  if (!Number.isFinite(g.npcX)) return;
  const sprite = game.levelId === '8-4' ? CAMPAIGN.princess : CAMPAIGN.toad;
  ctx.save(); ctx.beginPath(); ctx.rect(-camera, 0, game.world.width, game.world.height); ctx.clip();
  draw(ctx, sprite, g.npcX - camera, (g.floorY ?? g.y + g.h) - sprite.h, CAMPAIGN_PALETTE);
  ctx.restore();
}

export function renderGame(ctx, game) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.beginPath(); ctx.rect(0, 0, WIDTH, HEIGHT); ctx.clip();
  const theme = themeOf(game);
  ctx.fillStyle = ['underground', 'castle'].includes(theme) || ['night', 'gray'].includes(game.world.palette)
    ? '#000000' : theme === 'underwater' ? '#2038ec' : '#5c94fc';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const camera = Math.floor(game.cameraX);
  scenery(ctx, game, camera);
  decorations(ctx, game, camera);
  terrain(ctx, game, camera, false);
  mechanisms(ctx, game, camera);
  goal(ctx, game, camera);
  actors(ctx, game, camera);
  player(ctx, game, camera);
  terrain(ctx, game, camera, true);
  effects(ctx, game, camera);
  if (game.frenzy?.warpActive) for (const exit of game.world.exits || []) {
    if (exit.warp) text(ctx, exit.target.levelId.split('-')[0], exit.x + exit.w / 2 - 4 - camera, exit.y - 24);
  }
  text(ctx, 'MARIO', 24, 16);
  text(ctx, String(Math.max(0, Math.floor(game.score))).padStart(6, '0').slice(-6), 24, 24);
  draw(ctx, SCENERY.hudCoin, 88, 24, COLORS.actor);
  text(ctx, 'X' + String(game.coins % 100).padStart(2, '0'), 96, 24);
  text(ctx, 'WORLD', 144, 16); text(ctx, game.levelId === undefined ? '1-1' : game.levelId, 152, 24);
  text(ctx, 'TIME', 200, 16);
  text(ctx, String(Math.max(0, Math.ceil(game.time))).padStart(3, '0'), 208, 24);
  ctx.restore();
}
