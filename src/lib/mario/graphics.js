// Pixel patterns are redrawn in code; no DOM or image assets are needed at import.
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
  if (game.area !== 'overworld') return;
  const palette = COLORS.scenery;
  for (let section = Math.floor((camera - 192) / 768); section <= Math.floor((camera + WIDTH) / 768); section++) {
    const base = section * 768 - camera;
    draw(ctx, SCENERY.hill, base, 160, palette);
    draw(ctx, SCENERY.smallHill, base + 256, 176, palette);
    for (const [offset, y, count] of [[136, 48, 1], [312, 32, 1], [440, 48, 3], [584, 32, 2]]) {
      ctx.save(); ctx.beginPath(); ctx.rect(base + offset, y, 16, 24); ctx.clip();
      draw(ctx, SPRITES.cloud, base + offset, y, palette); ctx.restore();
      for (let i = 1; i < count; i++) draw(ctx, SCENERY.cloudMiddle, base + offset + i * 16, y, palette);
      ctx.save(); ctx.beginPath(); ctx.rect(base + offset + count * 16, y, 16, 24); ctx.clip();
      draw(ctx, SPRITES.cloud, base + offset + (count - 1) * 16, y, palette); ctx.restore();
    }
    for (const [offset, count] of [[184, 3], [376, 1], [664, 2]]) {
      draw(ctx, SCENERY.bushLeft, base + offset, 192, palette);
      for (let i = 1; i < count; i++) draw(ctx, SCENERY.bushMiddle, base + offset + i * 16, 192, palette);
      draw(ctx, SCENERY.bushRight, base + offset + count * 16, 192, palette);
    }
  }
}

function pipe(ctx, tile, camera) {
  const x = Math.floor(tile.x - camera), y = Math.floor(tile.y);
  const width = tile.direction === 'left' ? Math.max(tile.w, SCENERY.pipeLeft.w) : tile.w;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, width, tile.h); ctx.clip();
  if (tile.direction === 'left') {
    draw(ctx, SCENERY.pipeLeft, x, y, COLORS.scenery);
  } else {
    const capped = tile.direction !== 'vertical';
    if (capped) draw(ctx, SCENERY.pipeTop, x, y, COLORS.scenery);
    for (let row = capped ? 16 : 0; row < tile.h; row += 2)
      draw(ctx, capped ? SCENERY.pipeBody : SCENERY.pipeVertical, x, y + row, COLORS.scenery);
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
  const palette = game.area === 'underground' ? COLORS.underground : COLORS.terrain;
  for (const tile of game.world.tiles) {
    if (tile.hidden && !tile.used) continue;
    if (tile.x + tile.w < camera || tile.x > camera + WIDTH) continue;
    if ((tile.kind === 'pipe') !== foreground) continue;
    if (tile.kind === 'pipe') {
      if (tile.direction !== 'left') pipe(ctx, tile, camera);
      continue;
    }
    if (tile.kind === 'castle') { castle(ctx, tile, camera, palette); continue; }
    if (tile.kind === 'flagpole') {
      const x = Math.floor(tile.x - camera), y = Math.floor(tile.y);
      ctx.fillStyle = COLORS.scenery.l; ctx.fillRect(x + 7, y + 16, 2, Math.max(0, tile.h - 16));
      draw(ctx, SCENERY.flagCap, x, y + 8, COLORS.scenery);
      const fy = Math.floor(game.finish?.flagY ?? tile.flagY ?? game.flagY ?? y + 16);
      draw(ctx, SCENERY.flag, x - 8, fy, COLORS.scenery);
      continue;
    }
    const name = tile.used ? 'used' : tile.kind;
    const sprite = SPRITES[name === 'brick' && game.area === 'underground' ? 'undergroundBrick' : name];
    if (!sprite) continue;
    const y = Math.floor(tile.y - (tile.bump > 0 ? Math.sin((12 - tile.bump) * Math.PI / 12) * 4 : 0));
    ctx.save(); ctx.beginPath(); ctx.rect(Math.floor(tile.x - camera), y, tile.w, tile.h); ctx.clip();
    const first = Math.max(0, Math.floor((camera - tile.x) / 16) * 16);
    let colors = palette;
    if (name === 'question') {
      const shade = ['#fc9838', '#c84c0c', '#883000', '#c84c0c'][Math.floor(game.frame / 8) % 4];
      colors = { k: '#000000', b: '#c84c0c', a: shade };
    }
    if (name === 'used') colors = game.area === 'underground' ? COLORS.underground : COLORS.terrain;
    for (let ty = 0; ty < tile.h; ty += 16) {
      for (let tx = first; tx < tile.w && tile.x + tx < camera + WIDTH; tx += 16)
        draw(ctx, sprite, tile.x + tx - camera, y + ty, colors);
    }
    ctx.restore();
  }
  // The elbow overlaps the vertical pipe visually, without widening its collision box.
  if (foreground) for (const tile of game.world.tiles) {
    if (tile.kind === 'pipe' && tile.direction === 'left' && !(tile.hidden && !tile.used)
      && tile.x + SCENERY.pipeLeft.w >= camera && tile.x <= camera + WIDTH) pipe(ctx, tile, camera);
  }
}

function player(ctx, game, camera) {
  const p = game.player;
  if (p.hidden || (p.hurtTimer > 0 && Math.floor(game.frame / 4) % 2)) return;
  const power = game.transform ? (p.posePower ?? p.power) : p.power;
  let pose = 'idle';
  if (game.status === 'dying' || game.status === 'gameover') pose = 'death';
  else if (p.crouching || (power !== 'small' && p.h <= 24)) pose = 'crouch';
  else if (!p.grounded) pose = 'jump';
  else if (p.skidding || (Math.abs(p.vx) > 0.5 && Math.sign(p.vx) !== p.facing)) pose = 'skid';
  else if (Math.abs(p.vx) > 0.1) pose = 'run' + (Math.floor(game.frame / (Math.abs(p.vx) > 2 ? 4 : 7)) % 3);
  const sprites = power === 'small' || pose === 'death' ? MARIO_SMALL : MARIO_BIG;
  const sprite = sprites[pose] || sprites.idle;
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
    let palette = { ...COLORS.actor, c: game.area === 'underground' ? '#008088' : '#000000' };
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
    if (!enemy.alive && !enemy.squashed && !(enemy.squashTimer > 0)) continue;
    if (enemy.x + enemy.w < camera || enemy.x > camera + WIDTH) continue;
    const squashed = enemy.squashed || enemy.squashTimer > 0;
    const walking = enemy.alive && !squashed && Math.floor(game.frame / 8) % 2 === 1;
    const name = squashed ? 'squashed' : walking && ['goomba', 'koopa'].includes(enemy.type) ? enemy.type + 'Step' : enemy.type;
    const sprite = SPRITES[name];
    if (!sprite) continue;
    const palette = enemy.type === 'goomba' ? COLORS.enemy : COLORS.actor;
    const x = enemy.x + (enemy.w - sprite.w) / 2 - camera, y = enemy.y + enemy.h - sprite.h;
    draw(ctx, sprite, x, y, palette, enemy.type !== 'goomba' && enemy.vx > 0);
  }
  for (const ball of game.fireballs) draw(ctx, SPRITES.fireball, ball.x - camera, ball.y, COLORS.tile, Math.floor(game.frame / 3) % 2 === 1);
}

function effects(ctx, game, camera) {
  for (const effect of game.effects) {
    const x = Math.floor(effect.x - camera), y = Math.floor(effect.y);
    if (effect.type === 'score' || effect.type === 'text') text(ctx, effect.text ?? effect.value ?? '', x, y);
    else if (effect.type === 'coin') draw(ctx, SPRITES.coin, x, y, { ...COLORS.actor, c: game.area === 'underground' ? '#008088' : '#000000' });
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

export function renderGame(ctx, game) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.beginPath(); ctx.rect(0, 0, WIDTH, HEIGHT); ctx.clip();
  ctx.fillStyle = game.area === 'underground' ? '#000000' : '#5c94fc';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const camera = Math.floor(game.cameraX);
  scenery(ctx, game, camera);
  terrain(ctx, game, camera, false);
  actors(ctx, game, camera);
  player(ctx, game, camera);
  terrain(ctx, game, camera, true);
  effects(ctx, game, camera);
  text(ctx, 'MARIO', 24, 16);
  text(ctx, String(Math.max(0, Math.floor(game.score))).padStart(6, '0').slice(-6), 24, 24);
  draw(ctx, SCENERY.hudCoin, 88, 24, COLORS.actor);
  text(ctx, 'X' + String(game.coins % 100).padStart(2, '0'), 96, 24);
  text(ctx, 'WORLD', 144, 16); text(ctx, '1-1', 152, 24);
  text(ctx, 'TIME', 200, 16);
  text(ctx, String(Math.max(0, Math.ceil(game.time))).padStart(3, '0'), 208, 24);
  ctx.restore();
}
