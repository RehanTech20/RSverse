import type { WordCategory } from '../src/types/rsverse';

export const CATEGORY_WORDS: Record<WordCategory, Record<number, string[]>> = {
  Animals: {
    4: ['BEAR', 'WOLF', 'DEER', 'FROG', 'DUCK', 'HAWK', 'LYNX', 'SEAL', 'SWAN', 'LION', 'CRAB', 'DOVE'],
    5: ['TIGER', 'PANDA', 'EAGLE', 'OTTER', 'KOALA', 'ZEBRA', 'WHALE', 'SHARK', 'LEMUR', 'CAMEL', 'BISON', 'RAVEN'],
    6: ['FALCON', 'JAGUAR', 'MONKEY', 'PARROT', 'RABBIT', 'WALRUS', 'ALPACA', 'BADGER', 'FERRET', 'IGUANA', 'PUFFIN', 'TURTLE'],
    7: ['DOLPHIN', 'CHEETAH', 'PENGUIN', 'PANTHER', 'GIRAFFE', 'GAZELLE', 'HAMSTER', 'MEERKAT', 'OCTOPUS', 'PEACOCK', 'ROOSTER'],
  },
  Food: {
    4: ['CAKE', 'TACO', 'SOUP', 'PEAR', 'PLUM', 'RICE', 'CORN', 'MINT', 'KIWI', 'LIME', 'MILK', 'BRIE'],
    5: ['APPLE', 'PIZZA', 'PASTA', 'BREAD', 'MANGO', 'GRAPE', 'SUSHI', 'CURRY', 'DONUT', 'CREPE', 'MELON', 'BERRY', 'PEACH', 'OLIVE'],
    6: ['WAFFLE', 'COOKIE', 'COFFEE', 'NOODLE', 'BURGER', 'MUFFIN', 'ORANGE', 'BANANA', 'CHERRY', 'CHEESE', 'PANINI', 'SALMON'],
    7: ['PANCAKE', 'AVOCADO', 'BROWNIE', 'CUPCAKE', 'LASAGNA', 'NOODLES', 'POPCORN', 'PRETZEL', 'RAVIOLI', 'DESSERT', 'BISCUIT'],
  },
  Movies: {
    4: ['JAWS', 'DUNE', 'CARS', 'HERO', 'SOUL', 'COCO', 'TRON', 'THOR', 'RING', 'BOND', 'STAR', 'HULK'],
    5: ['ALIEN', 'SHREK', 'JOKER', 'ROCKY', 'DRIVE', 'TENET', 'FARGO', 'BRAVE', 'CLASH', 'GHOST', 'SPEED', 'MAGIC'],
    6: ['AVATAR', 'MATRIX', 'FROZEN', 'BATMAN', 'SIGNAL', 'PIRATE', 'SPIDER', 'MINION', 'WICKED', 'WONDER', 'PSYCHO', 'CASINO'],
    7: ['TITANIC', 'GRAVITY', 'ALADDIN', 'ENCANTO', 'ARRIVAL', 'MEMENTO', 'TANGLED', 'JUMANJI', 'TWISTER', 'VERTIGO'],
  },
  Anime: {
    4: ['GOKU', 'DEKU', 'NAMI', 'ZORO', 'GOJO', 'KIRA', 'YUJI', 'ANYA', 'LEVI', 'EREN', 'TOJI', 'SORA'],
    5: ['TITAN', 'GHOUL', 'AKIRA', 'SENKU', 'CHIBI', 'OTAKU', 'MECHA', 'MANGA', 'LUFFY', 'GOHAN', 'SANJI', 'GENOS'],
    6: ['NARUTO', 'BLEACH', 'SASUKE', 'SHINJI', 'MIKASA', 'TOTORO', 'SPIRIT', 'HUNTER', 'NEZUKO', 'ITACHI', 'BAKUGO', 'SHONEN'],
    7: ['POKEMON', 'TANJIRO', 'KAKASHI', 'PICCOLO', 'SAITAMA', 'CHOPPER', 'KRILLIN', 'SHINOBI', 'TSUNADE', 'JIRAIYA'],
  },
  Technology: {
    4: ['CODE', 'BYTE', 'CHIP', 'DATA', 'NODE', 'WIFI', 'SYNC', 'PORT', 'DISK', 'JAVA', 'RUST', 'HTML'],
    5: ['CLOUD', 'PIXEL', 'ROBOT', 'CYBER', 'STACK', 'LINUX', 'REACT', 'TOKEN', 'CACHE', 'PROXY', 'DEBUG', 'AUDIO'],
    6: ['SERVER', 'ROUTER', 'PYTHON', 'DOCKER', 'GITHUB', 'SOCKET', 'BINARY', 'MEMORY', 'SCREEN', 'SENSOR', 'SCRIPT', 'STREAM'],
    7: ['QUANTUM', 'NETWORK', 'BROWSER', 'COMPILE', 'ANDROID', 'DISPLAY', 'BATTERY', 'STORAGE', 'CIRCUIT', 'PROGRAM'],
  },
  Sports: {
    4: ['GOLF', 'SWIM', 'JUDO', 'POLO', 'RACE', 'GOAL', 'DUNK', 'KICK', 'PASS', 'TEAM', 'DIVE', 'PUNT'],
    5: ['RUGBY', 'TRACK', 'CHESS', 'CYCLE', 'SKATE', 'MATCH', 'SCORE', 'COURT', 'MEDAL', 'COACH', 'ARENA', 'RELAY'],
    6: ['SOCCER', 'TENNIS', 'HOCKEY', 'BOXING', 'ROWING', 'SPRINT', 'KARATE', 'SKIING', 'DIVING', 'BASKET', 'STRIKE', 'TROPHY'],
    7: ['CRICKET', 'ARCHERY', 'SURFING', 'BOWLING', 'CYCLING', 'FENCING', 'SKATING', 'REFEREE', 'STADIUM', 'VICTORY'],
  },
  General: {
    4: ['STAR', 'MOON', 'WIND', 'FIRE', 'RAIN', 'TIME', 'SONG', 'HOME', 'BOOK', 'GOLD', 'LAMP', 'WAVE'],
    5: ['OCEAN', 'LIGHT', 'DREAM', 'SPARK', 'CLOUD', 'PIANO', 'CROWN', 'RIVER', 'FLAME', 'STONE', 'ORBIT', 'PRISM'],
    6: ['PLANET', 'GALAXY', 'FOREST', 'BRIDGE', 'SILVER', 'CANDLE', 'SUMMER', 'WINTER', 'GARDEN', 'MIRROR', 'PUZZLE', 'CASTLE'],
    7: ['HORIZON', 'COMPASS', 'LANTERN', 'CRYSTAL', 'ECLIPSE', 'JOURNEY', 'DIAMOND', 'RAINBOW', 'HARMONY', 'MYSTERY'],
  },
  Romantic: {
    4: ['LOVE', 'KISS', 'HUGS', 'DATE', 'SOUL', 'RING', 'ROSE', 'WARM', 'GLOW', 'PAIR', 'DEAR', 'VOWS'],
    5: ['HEART', 'ADORE', 'CHARM', 'BLISS', 'SWEET', 'SPARK', 'AMOUR', 'TRUST', 'FLAME', 'DREAM', 'CRUSH', 'SMILE'],
    6: ['LOVELY', 'CUDDLE', 'TENDER', 'DEVOTE', 'SUNSET', 'FLOWER', 'BEAUTY', 'COUPLE', 'ADORE', 'WARMTH', 'DESIRE', 'HEARTS'].filter((w) => w.length === 6),
    7: ['FOREVER', 'ROMANCE', 'DARLING', 'BELOVED', 'PASSION', 'CHERISH', 'EMBRACE', 'PROMISE', 'DEVOTED', 'ETERNAL'],
  },
};

// Clean valid English words per length for guess validation (strictly clean alphabetic words)
const CLEAN_WORDS_4 = [
  'ABLE','ACID','AGED','ALSO','AREA','ARMY','AWAY','BABY','BACK','BALL','BAND','BANK','BASE','BATH','BEAR','BEAT','BEEN','BEER','BELL','BELT',
  'BEST','BILL','BIRD','BLOW','BLUE','BOAT','BODY','BOMB','BOND','BONE','BOOK','BOOM','BORN','BOSS','BOTH','BOWL','BULK','BURN','BUSH','BUSY',
  'BYTE','CAKE','CALL','CALM','CAME','CAMP','CARD','CARE','CASE','CASH','CAST','CELL','CHAT','CHIP','CITY','CLUB','COAL','COAT','CODE','COLD',
  'COME','COOK','COOL','COPE','COPY','CORE','CORN','COST','CRAB','CREW','CROP','DARK','DATA','DATE','DAWN','DAYS','DEAD','DEAL','DEAN','DEAR',
  'DEBT','DEEP','DEER','DENY','DESK','DIAL','DICE','DIET','DIRT','DISC','DISK','DOCK','DOES','DONE','DOOR','DOSE','DOVE','DOWN','DRAW','DREW',
  'DROP','DRUG','DUAL','DUCK','DUKE','DULL','DUMB','DUMP','DUNE','DUSK','DUST','DUTY','EACH','EARN','EASE','EAST','EASY','EDGE','ELSE','EVEN',
  'EVER','EVIL','EXIT','FACE','FACT','FADE','FAIL','FAIR','FALL','FAME','FARE','FARM','FAST','FATE','FEAR','FEED','FEEL','FEET','FELL','FELT',
  'FILE','FILL','FILM','FIND','FINE','FIRE','FIRM','FISH','FIVE','FLAG','FLAT','FLEW','FLEX','FLIP','FLOW','FOLD','FOLK','FOND','FOOD','FOOL',
  'FOOT','FORD','FORE','FORK','FORM','FORT','FOUR','FREE','FROG','FROM','FUEL','FULL','FUND','FURY','GAIN','GAME','GANG','GATE','GAVE','GEAR',
  'GENE','GIFT','GIRL','GIVE','GLAD','GLOW','GOAL','GOAT','GOES','GOLD','GOLF','GONE','GOOD','GRAB','GRAY','GREW','GREY','GRID','GRIN','GRIP',
  'GROW','GULF','GURU','HAIR','HALF','HALL','HAND','HANG','HARD','HARM','HATE','HAVE','HAWK','HEAD','HEAR','HEAT','HEEL','HELD','HELL','HELP',
  'HERE','HERO','HIDE','HIGH','HILL','HINT','HIRE','HOLD','HOLE','HOME','HOOD','HOOK','HOPE','HORN','HOST','HOUR','HUGE','HUGS','HUNG','HUNT',
  'HURT','ICON','IDEA','INCH','INTO','IRON','ITEM','JACK','JANE','JAWS','JAZZ','JEAN','JOHN','JOIN','JOKE','JUDO','JUMP','JUNE','JURY','JUST',
  'KEEN','KEEP','KICK','KILL','KIND','KING','KISS','KIWI','KNEE','KNEW','KNOW','LACK','LADY','LAID','LAKE','LAMP','LAND','LANE','LAST','LATE',
  'LEAD','LEAF','LEAN','LEFT','LEND','LENS','LESS','LIFE','LIFT','LIKE','LIME','LINE','LINK','LION','LIST','LIVE','LOAD','LOAN','LOCK','LOGO',
  'LONG','LOOK','LORD','LOSE','LOSS','LOST','LOUD','LOVE','LUCK','LUNG','LYNX','MADE','MAIL','MAIN','MAKE','MALE','MALL','MANY','MARK','MARS',
  'MASK','MASS','MATE','MATH','MEAL','MEAN','MEAT','MEET','MELT','MENU','MERE','MESS','MILE','MILK','MILL','MIND','MINE','MINT','MISS','MODE',
  'MOOD','MOON','MORE','MOST','MOVE','MUCH','MUST','MYTH','NAIL','NAME','NAVY','NEAR','NEAT','NECK','NEED','NEWS','NEXT','NICE','NINE','NODE',
  'NOON','NORM','NOSE','NOTE','OKAY','ONCE','ONLY','ONTO','OPEN','ORAL','OVER','PACE','PACK','PAGE','PAID','PAIN','PAIR','PALM','PARK','PART',
  'PASS','PAST','PATH','PEAK','PEAR','PEAT','PEEK','PEEL','PEER','PICK','PIKE','PILE','PILL','PINE','PINK','PIPE','PLAN','PLAY','PLOT','PLUG',
  'PLUM','PLUS','POEM','POET','POLE','POLL','POLO','POND','POOL','POOR','PORK','PORT','POST','POUR','PRAY','PULL','PUMP','PUNT','PURE','PUSH',
  'QUIT','RACE','RACK','RAGE','RAID','RAIL','RAIN','RANK','RARE','RATE','READ','REAL','REAR','RELY','RENT','REST','RICE','RICH','RIDE','RING',
  'RIOT','RISE','RISK','ROAD','ROAR','ROCK','ROLE','ROLL','ROOF','ROOM','ROOT','ROPE','ROSE','RULE','RUSH','RUST','SAFE','SAID','SAIL','SAKE',
  'SALE','SALT','SAME','SAND','SANG','SAVE','SEAL','SEAT','SEED','SEEK','SEEM','SEEN','SELF','SELL','SEND','SENT','SEPT','SHIP','SHOP','SHOT',
  'SHOW','SHUT','SICK','SIDE','SIGN','SILK','SING','SINK','SITE','SIZE','SKIN','SKIP','SLAM','SLIP','SLOT','SLOW','SNAP','SNOW','SOAK','SOAP',
  'SOAR','SOFT','SOIL','SOLD','SOLE','SOME','SONG','SOON','SORT','SOUL','SOUP','SOUR','SPAN','SPIN','SPOT','STAR','STAY','STEM','STEP','STOP',
  'SUCH','SUIT','SURE','SWAN','SWIM','SYNC','TACO','TAIL','TAKE','TALE','TALK','TALL','TANK','TAPE','TASK','TEAM','TEAR','TECH','TELL','TEND',
  'TENT','TERM','TEST','TEXT','THAN','THAT','THEM','THEN','THEY','THIN','THIS','THOR','THUS','TIDE','TILL','TIME','TINY','TIRE','TOLD','TOLL',
  'TONE','TONY','TOOK','TOOL','TOPS','TORE','TORN','TOUR','TOWN','TRAP','TRAY','TREE','TRIM','TRIO','TRIP','TRON','TRUE','TUBE','TUCK','TUNE',
  'TURN','TWIN','TYPE','UNIT','UPON','USED','USER','VARY','VAST','VERB','VERY','VEST','VIEW','VINE','VOID','VOTE','VOWS','WAGE','WAIT','WAKE',
  'WALK','WALL','WAND','WANT','WARD','WARM','WARN','WASH','WAVE','WAYS','WEAK','WEAR','WEEK','WELL','WENT','WERE','WEST','WHAT','WHEN','WHOM',
  'WIDE','WIFE','WIFI','WILD','WILL','WIND','WINE','WING','WIRE','WISE','WISH','WITH','WOLF','WOOD','WOOL','WORD','WORE','WORK','WORM','WORN',
  'WRAP','YARD','YEAH','YEAR','YELL','YOUR','ZERO','ZONE','ZOOM',
];

const CLEAN_WORDS_5 = [
  'ABOUT','ABOVE','ABUSE','ACTOR','ACUTE','ADMIT','ADOPT','ADORE','ADULT','AFTER','AGAIN','AGENT','AGREE','AHEAD','ALARM','ALBUM','ALERT','ALIEN',
  'ALIGN','ALIKE','ALIVE','ALLOW','ALONE','ALONG','ALTER','AMBER','AMONG','AMOUR','ANGEL','ANGER','ANGLE','ANGRY','ANIME','APART','APPLE','APPLY',
  'ARENA','ARGUE','ARISE','ARRAY','ASIDE','ASSET','AUDIO','AUDIT','AVOID','AWARD','AWARE','BADLY','BAKER','BASES','BASIC','BASIS','BEACH','BEGAN',
  'BEGIN','BEGUN','BEING','BELOW','BENCH','BERRY','BILLY','BIRTH','BISON','BLACK','BLADE','BLAME','BLANK','BLAST','BLAZE','BLEND','BLESS','BLIND',
  'BLISS','BLOCK','BLOOD','BLOOM','BLOWN','BOARD','BOOST','BOOTH','BOUND','BRAIN','BRAND','BRAVE','BREAD','BREAK','BREED','BRICK','BRIDE','BRIEF',
  'BRING','BROAD','BROKE','BROWN','BUILD','BUILT','BUYER','CABLE','CACHE','CALIF','CAMEL','CANDY','CARRY','CATCH','CAUSE','CHAIN','CHAIR','CHAOS',
  'CHARM','CHART','CHASE','CHEAP','CHECK','CHESS','CHEST','CHIBI','CHIEF','CHILD','CHINA','CHOSE','CIVIL','CLAIM','CLASH','CLASS','CLEAN','CLEAR',
  'CLICK','CLOCK','CLOSE','CLOUD','COACH','COAST','COLOR','COULD','COUNT','COURT','COVER','CRAFT','CRANE','CRASH','CRAZY','CREAM','CREED','CREPE',
  'CRIME','CRISP','CROSS','CROWD','CROWN','CRUSH','CURRY','CURVE','CYBER','CYCLE','DAILY','DANCE','DATED','DEALT','DEATH','DEBUG','DEBUT','DELAY',
  'DEPTH','DOING','DONUT','DOUBT','DOZEN','DRAFT','DRAMA','DRAWN','DREAM','DRESS','DRINK','DRIVE','DROVE','DYING','EAGER','EAGLE','EARLY','EARTH',
  'EIGHT','ELITE','EMPTY','ENEMY','ENJOY','ENTER','ENTRY','EQUAL','ERROR','EVENT','EVERY','EXACT','EXIST','EXTRA','FAITH','FALSE','FARGO','FAULT',
  'FIBER','FIELD','FIFTH','FIFTY','FIGHT','FINAL','FIRST','FIXED','FLAME','FLASH','FLEET','FLOOR','FLUID','FOCUS','FORCE','FORTH','FORTY','FORUM',
  'FOUND','FRAME','FRANK','FRAUD','FRESH','FRONT','FRUIT','FULLY','FUNNY','GHOST','GIANT','GIVEN','GLASS','GLOBE','GLORY','GOING','GRACE','GRADE',
  'GRAND','GRANT','GRAPE','GRASS','GREAT','GREEN','GROSS','GROUP','GROWN','GUARD','GUESS','GUEST','GUIDE','HAPPY','HARRY','HEART','HEAVY','HENCE',
  'HENRY','HORSE','HOTEL','HOUSE','HUMAN','IDEAL','IMAGE','INDEX','INNER','INPUT','ISSUE','JAPAN','JIMMY','JOINT','JOKER','JONES','JUDGE','KNOWN',
  'KOALA','LABEL','LARGE','LASER','LATER','LAUGH','LAYER','LEARN','LEASE','LEAST','LEAVE','LEGAL','LEMON','LEMUR','LEVEL','LEWIS','LIGHT','LIMIT',
  'LINKS','LINUX','LIVES','LOCAL','LOGIC','LOOSE','LOWER','LUCKY','LUNCH','LYING','MAGIC','MAJOR','MAKER','MANGO','MARCH','MARIA','MATCH','MAYBE',
  'MAYOR','MEANT','MEDAL','MEDIA','MELON','METAL','MIGHT','MINOR','MINUS','MIXED','MODEL','MONEY','MONTH','MORAL','MOTOR','MOUNT','MOUSE','MOUTH',
  'MOVIE','MUSIC','NEEDS','NEVER','NEWLY','NIGHT','NOISE','NORTH','NOTED','NOVEL','NURSE','OCCUR','OCEAN','OFFER','OFTEN','OLIVE','ORBIT','ORDER',
  'OTAKU','OTHER','OTTER','OUGHT','PAINT','PANDA','PANEL','PAPER','PARTY','PASTA','PEACE','PEACH','PETER','PHASE','PHONE','PHOTO','PIANO','PIECE',
  'PILOT','PITCH','PIZZA','PLACE','PLAIN','PLANE','PLANT','PLATE','POINT','POUND','POWER','PRESS','PRICE','PRIDE','PRIME','PRINT','PRIOR','PRISM',
  'PRIZE','PROOF','PROUD','PROVE','PROXY','QUEEN','QUICK','QUIET','QUITE','RADIO','RAISE','RANGE','RAPID','RATIO','RAVEN','REACH','REACT','READY',
  'REFER','RELAY','RIGHT','RIVAL','RIVER','ROBIN','ROBOT','ROCKY','ROGER','ROMAN','ROUGH','ROUND','ROUTE','ROYAL','RUGBY','RURAL','SCALE','SCENE',
  'SCOPE','SCORE','SENSE','SERVE','SEVEN','SHALL','SHAPE','SHARE','SHARK','SHARP','SHEET','SHELF','SHELL','SHIFT','SHINE','SHIRT','SHOCK','SHOOT',
  'SHORT','SHOWN','SHREK','SIGHT','SINCE','SIXTH','SIXTY','SIZED','SKATE','SKILL','SLEEP','SLIDE','SMALL','SMART','SMILE','SMITH','SMOKE','SOLID',
  'SOLVE','SORRY','SOUND','SOUTH','SPACE','SPARE','SPARK','SPEAK','SPEED','SPEND','SPENT','SPLIT','SPOKE','SPORT','STACK','STAFF','STAGE','STAKE',
  'STAND','START','STATE','STEAM','STEEL','STICK','STILL','STOCK','STONE','STOOD','STORE','STORM','STORY','STRIP','STUCK','STUDY','STUFF','STYLE',
  'SUGAR','SUITE','SUPER','SUSHI','SWEET','TABLE','TAKEN','TASTE','TAXES','TEACH','TEETH','TENET','TERRY','TEXAS','THANK','THEFT','THEIR','THEME',
  'THERE','THESE','THICK','THING','THINK','THIRD','THOSE','THREE','THREW','THROW','TIGER','TIGHT','TIMES','TIRED','TITAN','TITLE','TODAY','TOKEN',
  'TOPIC','TOTAL','TOUCH','TOUGH','TOWER','TRACK','TRADE','TRAIN','TREAT','TREND','TRIAL','TRIED','TRIES','TRUCK','TRULY','TRUST','TRUTH','TWICE',
  'UNDER','UNDUE','UNION','UNITY','UNTIL','UPPER','UPSET','URBAN','USAGE','USUAL','VALID','VALUE','VIDEO','VIRUS','VISIT','VITAL','VOICE','WASTE',
  'WATCH','WATER','WHALE','WHEEL','WHERE','WHICH','WHILE','WHITE','WHOLE','WHOSE','WOMAN','WOMEN','WORLD','WORRY','WORSE','WORST','WORTH','WOULD',
  'WOUND','WRITE','WRONG','WROTE','YIELD','YOUNG','YOUTH','ZEBRA',
];

const CLEAN_WORDS_6 = [
  'ACTION','ACTIVE','ADVICE','AFFAIR','AFFECT','AGENCY','AGENDA','ALMOST','ALPACA','ALWAYS','AMOUNT','ANIMAL','ANNUAL','ANSWER','ANYONE','ANYWAY',
  'APPEAL','APPEAR','AROUND','ARRIVE','ARTIST','ASPECT','ASSESS','ASSIST','ASSUME','ATTACK','ATTEND','AUGUST','AUTHOR','AVATAR','AVENUE','BACKED',
  'BADGER','BANANA','BARELY','BARREL','BASKET','BATMAN','BATTLE','BEAUTY','BECAME','BECOME','BEFORE','BEHALF','BEHIND','BELIEF','BELONG','BETTER',
  'BEYOND','BINARY','BLEACH','BORDER','BOTTLE','BOTTOM','BOUGHT','BOXING','BRANCH','BREATH','BRIDGE','BRIGHT','BROKEN','BUDGET','BURDEN','BUREAU',
  'BURGER','BUTTON','CAMERA','CANCER','CANDLE','CANNOT','CARBON','CAREER','CASTLE','CASUAL','CAUGHT','CENTER','CENTRE','CHANCE','CHANGE','CHARGE',
  'CHEESE','CHERRY','CHOICE','CHOOSE','CHOSEN','CHURCH','CIRCLE','CLIENT','CLOSED','CLOSER','COFFEE','COLUMN','COMBAT','COMING','COMMON','COMPLY',
  'COOKIE','COPPER','CORNER','COSTLY','COUNTY','COUPLE','COURSE','COVERS','CREATE','CREDIT','CRISIS','CUSTOM','DAMAGE','DANGER','DEALER','DEBATE',
  'DECADE','DECIDE','DEFEAT','DEFEND','DEFINE','DEGREE','DEMAND','DEPEND','DEPUTY','DESERT','DESIGN','DESIRE','DETAIL','DETECT','DEVICE','DEVOTE',
  'DIFFER','DINNER','DIRECT','DIVING','DOCKER','DOCTOR','DOLLAR','DOMAIN','DOUBLE','DRIVEN','DRIVER','DURING','EASILY','EATING','EDITOR','EFFECT',
  'EFFORT','EIGHTH','EITHER','ELEVEN','EMERGE','EMPIRE','EMPLOY','ENABLE','ENDING','ENERGY','ENGAGE','ENGINE','ENOUGH','ENSURE','ENTIRE','ENTITY',
  'EQUITY','ESCAPE','ESTATE','ETHNIC','EXCEED','EXCEPT','EXCESS','EXPAND','EXPECT','EXPERT','EXPORT','EXTEND','EXTENT','FABRIC','FACING','FACTOR',
  'FAILED','FAIRLY','FALCON','FALLEN','FAMILY','FAMOUS','FATHER','FELLOW','FEMALE','FERRET','FIGURE','FILING','FINGER','FINISH','FISCAL','FLIGHT',
  'FLOWER','FLYING','FOLLOW','FORCED','FOREST','FORGET','FORMAL','FORMAT','FORMER','FOSTER','FOUGHT','FOURTH','FRENCH','FRIEND','FROZEN','FUTURE',
  'GALAXY','GARDEN','GATHER','GENDER','GERMAN','GITHUB','GLOBAL','GOLDEN','GROUND','GROWTH','GUILTY','HANDED','HANDLE','HAPPEN','HARDLY','HEADED',
  'HEALTH','HEIGHT','HIDDEN','HOCKEY','HOLDER','HONEST','HUNTER','IGUANA','IMPACT','IMPORT','INCOME','INDEED','INJURY','INSIDE','INTENT','INVEST',
  'ISLAND','ITSELF','JAGUAR','JERSEY','JOSEPH','JUNIOR','KARATE','KILLED','LABOUR','LATEST','LATTER','LAUNCH','LAWYER','LEADER','LEAGUE','LEAVES',
  'LEGACY','LENGTH','LESSON','LETTER','LIGHTS','LIKELY','LINKED','LIQUID','LISTEN','LITTLE','LIVING','LOCKED','LONDON','LONGER','LOOKED','LOSING',
  'LOVELY','LOVING','LUXURY','MAINLY','MAKING','MANAGE','MANNER','MANUAL','MARGIN','MARINE','MARKED','MARKET','MARTIN','MASTER','MATRIX','MATTER',
  'MATURE','MEDIUM','MEMBER','MEMORY','MENTAL','MERELY','MERGER','METHOD','MIDDLE','MILLER','MINION','MINING','MINUTE','MIRROR','MOBILE','MODERN',
  'MODEST','MODULE','MOMENT','MONKEY','MORRIS','MOSTLY','MOTHER','MOTION','MOVING','MUFFIN','MURDER','MUSEUM','MUTUAL','MYSELF','NARROW','NARUTO',
  'NATION','NATIVE','NATURE','NEARBY','NEARLY','NIGHTS','NOBODY','NOODLE','NORMAL','NOTICE','NOTION','NUMBER','OBJECT','OBTAIN','OFFICE','OFFSET',
  'ONLINE','OPTION','ORANGE','ORIGIN','OUTPUT','OXFORD','PACKED','PALACE','PARENT','PARROT','PARTLY','PATENT','PEOPLE','PERIOD','PERMIT','PERSON',
  'PHRASE','PICKED','PIRATE','PLANET','PLAYER','PLEASE','PLENTY','POCKET','POLICE','POLICY','PREFER','PRETTY','PRINCE','PRISON','PROFIT','PROPER',
  'PROVEN','PUBLIC','PUFFIN','PURSUE','PUZZLE','PYTHON','RABBIT','RAISED','RANDOM','RARELY','RATHER','RATING','READER','REALLY','REASON','RECALL',
  'RECENT','RECORD','REDUCE','REFORM','REGARD','REGIME','REGION','RELATE','RELIEF','REMAIN','REMOTE','REMOVE','REPAIR','REPEAT','REPLAY','REPORT',
  'RESCUE','RESORT','RESULT','RETAIL','RETAIN','RETURN','REVEAL','REVIEW','REWARD','RIDING','RISING','ROBUST','ROUTER','ROWING','RULING','SAFETY',
  'SALARY','SALMON','SAMPLE','SASUKE','SAVING','SAYING','SCHEME','SCHOOL','SCREEN','SCRIPT','SEARCH','SEASON','SECOND','SECRET','SECTOR','SECURE',
  'SEEING','SELECT','SELLER','SENIOR','SENSOR','SERIES','SERVER','SETTLE','SEVERE','SEXUAL','SHOULD','SIGNAL','SIGNED','SILENT','SILVER','SIMPLE',
  'SIMPLY','SINGLE','SISTER','SKIING','SLIGHT','SMOOTH','SOCCER','SOCIAL','SOCKET','SODIUM','SOLELY','SOLVED','SOUGHT','SOURCE','SOVIET','SPEECH',
  'SPIDER','SPIRIT','SPOKEN','SPREAD','SPRING','SPRINT','SQUARE','STABLE','STATUS','STEADY','STOLEN','STRAIN','STREAM','STREET','STRESS','STRICT',
  'STRIKE','STRING','STRONG','STRUCK','STUDIO','SUBMIT','SUDDEN','SUFFER','SUMMER','SUMMIT','SUNSET','SUPPLY','SURELY','SURVEY','SWITCH','SYMBOL',
  'SYSTEM','TAKING','TALENT','TARGET','TAUGHT','TENANT','TENDER','TENNIS','THANKS','THEORY','THIRTY','THOUGH','THREAT','THROWN','TICKET','TIMBER',
  'TIMING','TISSUE','TOTORO','TOWARD','TRAVEL','TREATY','TROPHY','TRYING','TURTLE','TWELVE','TWENTY','UNABLE','UNIQUE','UNITED','UNLESS','UNLIKE',
  'UPDATE','USEFUL','VALLEY','VARIED','VENDOR','VERSUS','VICTIM','VISION','VISUAL','VOLUME','WAFFLE','WALKER','WALRUS','WEALTH','WEEKLY','WEIGHT',
  'WHOLLY','WINDOW','WINNER','WINTER','WITHIN','WONDER','WORKER','WRIGHT','WRITER','YELLOW',
];

const CLEAN_WORDS_7 = [
  'ABILITY','ABSENCE','ACADEMY','ACCOUNT','ACCUSED','ACHIEVE','ACQUIRE','ADDRESS','ADVANCE','ADVERSE','ADVISED','ADVISER','AGAINST','AIRLINE','AIRPORT',
  'ALADDIN','ALCOHOL','ALLEGED','ALREADY','ANALYST','ANCIENT','ANDROID','ANOTHER','ANXIETY','ANYBODY','APPLIED','ARRANGE','ARRIVAL','ARTICLE','ASSAULT',
  'ASSUMED','ASSURED','ATTEMPT','ATTRACT','AUCTION','AVERAGE','AVOCADO','BACKING','BALANCE','BANKING','BARRIER','BATTERY','BEARING','BEATING','BECAUSE',
  'BEDROOM','BELIEVE','BELOVED','BENEATH','BENEFIT','BESIDES','BETWEEN','BILLION','BINDING','BISCUIT','BOWLING','BROTHER','BROUGHT','BROWNIE','BROWSER',
  'BURNING','CABINET','CALIBER','CALLING','CAPABLE','CAPITAL','CAPTAIN','CAPTION','CAPTURE','CAREFUL','CARRIER','CAUTION','CEILING','CENTRAL','CENTURY',
  'CERTAIN','CHAMBER','CHANNEL','CHAPTER','CHARITY','CHARLIE','CHARTER','CHECKED','CHEETAH','CHERISH','CHICKEN','CHRONIC','CIRCUIT','CLASSES','CLASSIC',
  'CLIMATE','CLOSING','CLOSURE','CLOTHES','COLLECT','COLLEGE','COMBINE','COMFORT','COMMAND','COMMENT','COMPACT','COMPANY','COMPARE','COMPETE','COMPILE',
  'COMPLEX','CONCEPT','CONCERN','CONCERT','CONDUCT','CONFIRM','CONNECT','CONSENT','CONSIST','CONTACT','CONTAIN','CONTENT','CONTEST','CONTEXT','CONTROL',
  'CONVERT','CORRECT','COUNCIL','COUNSEL','COUNTER','COUNTRY','COURAGE','COVERED','CREATOR','CRICKET','CRYSTAL','CULTURE','CUPCAKE','CURRENT','CUTTING',
  'CYCLING','DARLING','DEALING','DECIDED','DECLINE','DEFAULT','DEFENCE','DEFICIT','DELIVER','DENSITY','DEPOSIT','DESKTOP','DESPITE','DESTROY','DEVELOP',
  'DEVOTED','DIAMOND','DIGITAL','DISCUSS','DISEASE','DISPLAY','DISPUTE','DISTANT','DIVERSE','DIVIDED','DOLPHIN','DRAWING','DRIVING','DYNAMIC','EASTERN',
  'ECLIPSE','ECONOMY','EDITION','ELDERLY','ELEMENT','EMBRACE','ENCANTO','ENGAGED','ENHANCE','ESSENCE','EVENING','EVIDENT','EXACTLY','EXAMINE','EXAMPLE',
  'EXCITED','EXCLUDE','EXHIBIT','EXPENSE','EXPLAIN','EXPLORE','EXPRESS','EXTREME','FACTORY','FACULTY','FAILING','FAILURE','FASHION','FEATURE','FEDERAL',
  'FEELING','FENCING','FICTION','FIFTEEN','FILLING','FINANCE','FINDING','FISHING','FITNESS','FOREIGN','FOREVER','FORMULA','FORTUNE','FORWARD','FOUNDED',
  'FREEDOM','FURTHER','GALLERY','GAZELLE','GENERAL','GENETIC','GENUINE','GIRAFFE','GLASSED','GRAVITY','GREATER','GREATLY','GROWING','HABITAT','HAMSTER',
  'HANGING','HARMONY','HEADING','HEALTHY','HEARING','HEATING','HELPFUL','HERSELF','HIGHWAY','HIMSELF','HISTORY','HOLDING','HOLIDAY','HORIZON','HOUSING',
  'HOWEVER','HUNDRED','HUSBAND','ILLEGAL','ILLNESS','IMAGINE','IMAGING','IMPROVE','INCLUDE','INITIAL','INQUIRY','INSIGHT','INSTALL','INSTANT','INSTEAD',
  'INTENSE','INTERIM','INVOLVE','JOINTLY','JOURNAL','JOURNEY','JUSTICE','JUSTIFY','KEEPING','KILLING','KINGDOM','KITCHEN','KNOWING','LANDING','LANTERN',
  'LARGELY','LASAGNA','LASTING','LEADING','LEARNED','LEISURE','LIBERAL','LIBERTY','LIBRARY','LICENSE','LIMITED','LISTING','LOGICAL','LOYALTY','MACHINE',
  'MANAGER','MARRIED','MASSIVE','MAXIMUM','MEANING','MEASURE','MEDICAL','MEERKAT','MEETING','MEMENTO','MENTION','MESSAGE','MILLION','MINERAL','MINIMAL',
  'MINIMUM','MISSING','MISSION','MISTAKE','MIXTURE','MONITOR','MONTHLY','MORNING','MUSICAL','MYSTERY','NATURAL','NEITHER','NERVOUS','NETWORK','NEUTRAL',
  'NOODLES','NOTABLE','NOTHING','NOWHERE','NUCLEAR','NURSING','OBVIOUS','OCTOBER','OCTOPUS','OFFENSE','OFFICER','ONGOING','OPENING','OPERATE','OPINION',
  'OPTICAL','ORGANIC','OUTCOME','OUTDOOR','OUTLOOK','OUTSIDE','OVERALL','PACIFIC','PACKAGE','PAINTED','PANCAKE','PANTHER','PARKING','PARTIAL','PARTNER',
  'PASSAGE','PASSING','PASSION','PASSIVE','PATIENT','PATTERN','PAYABLE','PAYMENT','PEACOCK','PENALTY','PENDING','PENGUIN','PENSION','PERCENT','PERFECT',
  'PERFORM','PERHAPS','PHOENIX','PICKING','PICTURE','PIONEER','PLASTIC','POINTED','POKEMON','POPCORN','POPULAR','PORTION','POVERTY','PRECISE','PREDICT',
  'PREMIER','PREMIUM','PREPARE','PRESENT','PRETZEL','PREVENT','PRIMARY','PRINTER','PRIVACY','PRIVATE','PROBLEM','PROCEED','PROCESS','PRODUCE','PRODUCT',
  'PROFILE','PROGRAM','PROJECT','PROMISE','PROMOTE','PROTECT','PROTEIN','PROTEST','PROVIDE','PUBLISH','PURPOSE','PUSHING','QUALIFY','QUALITY','QUANTUM',
  'QUARTER','RADICAL','RAILWAY','RAINBOW','RAVIOLI','READILY','READING','REALITY','REALIZE','RECEIPT','RECEIVE','RECOVER','REFLECT','REGULAR','RELATED',
  'RELEASE','REMAINS','REMOVAL','REMOVED','REPLACE','REQUEST','REQUIRE','RESERVE','RESOLVE','RESPECT','RESPOND','RESTORE','RETIRED','REVENUE','REVERSE',
  'ROLLING','ROMANCE','ROOSTER','ROUTINE','RUNNING','SAITAMA','SATISFY','SCIENCE','SECTION','SEGMENT','SERIOUS','SERVICE','SERVING','SESSION','SETTING',
  'SEVENTH','SEVERAL','SHORTLY','SHOWING','SILENCE','SILICON','SIMILAR','SITTING','SIXTEEN','SKATING','SKILLED','SMOKING','SOCIETY','SOMEHOW','SOMEONE',
  'SPEAKER','SPECIAL','SPECIES','SPONSOR','STADIUM','STATION','STORAGE','STRANGE','STRETCH','STUDENT','STUDIED','SUBJECT','SUCCEED','SUCCESS','SUGGEST',
  'SUMMARY','SUPPORT','SUPPOSE','SUPREME','SURFACE','SURFING','SURGERY','SURPLUS','SURVIVE','SUSPECT','SUSTAIN','TANGLED','TANJIRO','TEACHER','TELECOM',
  'TELLING','TENSION','THEATRE','THERAPY','THEREBY','THOUGHT','THROUGH','TITANIC','TONIGHT','TOTALLY','TOUCHED','TOWARDS','TRAFFIC','TRAINED','TRANSIT',
  'TREATED','TROUBLE','TURNING','TYPICAL','UNIFORM','UNKNOWN','UNUSUAL','UPGRADE','UPSCALE','UTILITY','VARIETY','VARIOUS','VEHICLE','VENTURE','VERSION',
  'VETERAN','VICTORY','VIEWING','VILLAGE','VIOLENT','VIRTUAL','VISIBLE','VISITOR','WAITING','WALKING','WANTING','WARNING','WARRANT','WEATHER',
  'WEBSITE','WEDDING','WEEKEND','WELCOME','WELFARE','WESTERN','WHEREAS','WHEREBY','WHETHER','WILLING','WINNING','WITHOUT','WITNESS','WORKING','WRITING',
  'WRITTEN',
];

export function getWordsByLength(length: number, category?: WordCategory): string[] {
  if (category && CATEGORY_WORDS[category]?.[length]) {
    return CATEGORY_WORDS[category][length].filter((w) => w.length === length && /^[A-Z]+$/.test(w));
  }
  const all = new Set<string>();
  Object.values(CATEGORY_WORDS).forEach((byLen) => {
    (byLen[length] || []).forEach((w) => {
      if (w.length === length && /^[A-Z]+$/.test(w)) all.add(w);
    });
  });
  return Array.from(all);
}

export function isValidDictionaryWord(word: string, targetWord: string): boolean {
  const upper = word.toUpperCase();
  if (upper === targetWord.toUpperCase()) return true;
  if (!/^[A-Z]+$/.test(upper)) return false;
  const len = upper.length;
  const pool =
    len === 4
      ? CLEAN_WORDS_4
      : len === 5
      ? CLEAN_WORDS_5
      : len === 6
      ? CLEAN_WORDS_6
      : CLEAN_WORDS_7;
  if (pool.includes(upper)) return true;
  // Also allow all category words
  for (const cat of Object.values(CATEGORY_WORDS)) {
    if (cat[len]?.includes(upper)) return true;
  }
  return false;
}

export interface EmojiPuzzle {
  id: string;
  emojis: string;
  answer: string;
  acceptedAnswers: string[];
  category: 'Movies' | 'Anime' | 'Songs' | 'Characters' | 'Phrases';
  difficulty: 'easy' | 'medium' | 'hard';
  hint: string;
}

export const EMOJI_PUZZLES: EmojiPuzzle[] = [
  { id: 'em-1', emojis: '🦁👑🌅', answer: 'The Lion King', acceptedAnswers: ['lion king', 'the lion king'], category: 'Movies', difficulty: 'easy', hint: 'Disney classic set in the Pride Lands' },
  { id: 'em-2', emojis: '🚢🧊💔🎻', answer: 'Titanic', acceptedAnswers: ['titanic'], category: 'Movies', difficulty: 'easy', hint: 'Jack and Rose aboard an unsinkable ship' },
  { id: 'em-3', emojis: '🕷️🧑🏻🕸️🗽', answer: 'Spider-Man', acceptedAnswers: ['spiderman', 'spider man', 'spider-man'], category: 'Characters', difficulty: 'easy', hint: 'Friendly neighborhood web-slinger' },
  { id: 'em-4', emojis: '🎈🏠👴🏽👦🏻', answer: 'Up', acceptedAnswers: ['up'], category: 'Movies', difficulty: 'easy', hint: 'Pixar film about a flying house' },
  { id: 'em-5', emojis: '🏴‍☠️👒⛵🍖', answer: 'One Piece', acceptedAnswers: ['one piece', 'luffy'], category: 'Anime', difficulty: 'easy', hint: 'Straw Hat pirates searching for treasure' },
  { id: 'em-6', emojis: '📓✍️🍎💀', answer: 'Death Note', acceptedAnswers: ['death note'], category: 'Anime', difficulty: 'medium', hint: 'Light Yagami finds a shinigami notebook' },
  { id: 'em-7', emojis: '🍜🍥🦊🥷', answer: 'Naruto', acceptedAnswers: ['naruto', 'naruto shippuden'], category: 'Anime', difficulty: 'easy', hint: 'Hidden Leaf ninja who loves ramen' },
  { id: 'em-8', emojis: '🧱⚔️👹🌊', answer: 'Demon Slayer', acceptedAnswers: ['demon slayer', 'kimetsu no yaiba'], category: 'Anime', difficulty: 'medium', hint: 'Tanjiro uses water breathing techniques' },
  { id: 'em-9', emojis: '🌧️☔🎶💃', answer: 'Singing in the Rain', acceptedAnswers: ['singing in the rain', 'singin in the rain'], category: 'Songs', difficulty: 'medium', hint: 'Classic musical song about dancing in a downpour' },
  { id: 'em-10', emojis: '☕💔🧣🍂', answer: 'All Too Well', acceptedAnswers: ['all too well'], category: 'Songs', difficulty: 'hard', hint: 'Taylor Swift track famous for a red scarf' },
  { id: 'em-11', emojis: '🌙✨🚶‍♂️', answer: 'Moonwalk', acceptedAnswers: ['moonwalk', 'moon walk'], category: 'Phrases', difficulty: 'medium', hint: 'Iconic backwards dance move' },
  { id: 'em-12', emojis: '🦋🦋🤢', answer: 'Butterflies in my stomach', acceptedAnswers: ['butterflies in my stomach', 'butterflies'], category: 'Phrases', difficulty: 'medium', hint: 'Nervous excited feeling when you like someone' },
  { id: 'em-13', emojis: '🕰️🔥🕊️', answer: 'Catching Fire', acceptedAnswers: ['catching fire', 'hunger games catching fire'], category: 'Movies', difficulty: 'hard', hint: 'Second Hunger Games installment' },
  { id: 'em-14', emojis: '🧠🌀🛌⏳', answer: 'Inception', acceptedAnswers: ['inception'], category: 'Movies', difficulty: 'medium', hint: 'Dreams inside dreams with a spinning top' },
  { id: 'em-15', emojis: '⚡👓🪄🦉', answer: 'Harry Potter', acceptedAnswers: ['harry potter'], category: 'Characters', difficulty: 'easy', hint: 'The boy who lived at Hogwarts' },
  { id: 'em-16', emojis: '⭐🌌⚔️🤖', answer: 'Star Wars', acceptedAnswers: ['star wars'], category: 'Movies', difficulty: 'easy', hint: 'May the Force be with you' },
  { id: 'em-17', emojis: '🌹🕰️🕯️🦁', answer: 'Beauty and the Beast', acceptedAnswers: ['beauty and the beast'], category: 'Movies', difficulty: 'medium', hint: 'Enchanted rose petals falling in a castle' },
  { id: 'em-18', emojis: '👻🐉🏮🛁', answer: 'Spirited Away', acceptedAnswers: ['spirited away'], category: 'Anime', difficulty: 'hard', hint: 'Studio Ghibli film set in a spirit bathhouse' },
];

export const TRUTH_OR_DARE_DECK: Array<{ category: 'Funny' | 'Romantic' | 'Interesting' | 'Challenging'; type: 'truth' | 'dare'; text: string }> = [
  { category: 'Romantic', type: 'truth', text: 'What was the exact moment you realized you felt something special for me?' },
  { category: 'Romantic', type: 'truth', text: 'Which small habit of mine secretly makes you smile every time?' },
  { category: 'Romantic', type: 'truth', text: 'What is one memory of us that you replay in your head the most?' },
  { category: 'Romantic', type: 'dare', text: 'Send a heartfelt 2-sentence voice or chat message describing your favorite thing about us.' },
  { category: 'Romantic', type: 'dare', text: 'Plan our next virtual or in-person date night right now in the chat with 3 details.' },
  { category: 'Funny', type: 'truth', text: 'What is the weirdest or funniest thing you have ever done when nobody was watching?' },
  { category: 'Funny', type: 'truth', text: 'If you had to survive a zombie apocalypse using only the item to your left, what is it?' },
  { category: 'Funny', type: 'dare', text: 'Type your next chat message using only emojis and let your partner guess what you mean.' },
  { category: 'Funny', type: 'dare', text: 'Invent a ridiculous nickname for your partner and use it for the next 3 rounds.' },
  { category: 'Interesting', type: 'truth', text: 'If we could wake up tomorrow in any city on Earth for 48 hours, where are we going?' },
  { category: 'Interesting', type: 'truth', text: 'What is a skill or hobby you would love for the two of us to learn together this year?' },
  { category: 'Interesting', type: 'dare', text: 'Describe your dream weekend together without using the words phone, work, or sleep.' },
  { category: 'Interesting', type: 'dare', text: 'Share the last photo you took or saved (or describe it in vivid detail if private).' },
  { category: 'Challenging', type: 'truth', text: 'What is one fear or insecurity you rarely talk about out loud?' },
  { category: 'Challenging', type: 'truth', text: 'Be honest: which of the 9 games here do you secretly think you are unbeatable at?' },
  { category: 'Challenging', type: 'dare', text: 'Give your partner a genuine compliment for 20 seconds straight without repeating any adjectives.' },
  { category: 'Challenging', type: 'dare', text: 'Let your partner pick the next game we play and accept a 5-point handicap if possible.' },
];

export const WHO_KNOWS_WHO_QUESTIONS: string[] = [
  'What is my ultimate comfort food after a long day?',
  'Am I more of an early bird or a late-night owl?',
  'What movie or show could I rewatch endlessly without getting bored?',
  'What is my go-to coffee, tea, or late-night drink order?',
  'Which superpower would I pick first if given the choice?',
  'What kind of vacation sounds better to me: cozy cabin in the mountains or sunny beach?',
  'What small gesture instantly brightens my mood when I am stressed?',
  'Which season of the year is my absolute favorite?',
  'What is one song that always gets me singing along?',
  'Am I more likely to overpack or pack 10 minutes before leaving?',
  'What is my favorite dessert flavor?',
  'What is the first thing I usually check on my phone in the morning?',
];

export const DRAWING_WORDS: string[] = [
  'SUNSET', 'ECLIPSE', 'GUITAR', 'LANTERN', 'COFFEE', 'DRAGON', 'COMPASS', 'RAINBOW',
  'ASTRONAUT', 'FIREWORKS', 'BUTTERFLY', 'WATERFALL', 'TELESCOPE', 'POLAROID', 'CROISSANT',
  'LIGHTHOUSE', 'CAMPFIRE', 'SNOWMAN', 'OCTOPUS', 'UNICORN', 'CASTLE', 'AIRPLANE',
];
