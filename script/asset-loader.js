/* ================================================================
   ASSET-LOADER.JS — High-performance Preloader & Audio Cache
   ----------------------------------------------------------------
   Preloads card images and voice audio in the background:
     1. In Level.html: Preloads level map assets and primes voice
        audio/images for the active subject's levels into browser cache.
     2. In Gameplay: Instantly prepares and caches all card images
        and voice recordings for the current level into MMAudioCache.
   Zero network lag during card matching on Vercel/mobile.
   ================================================================ */

(function () {
  'use strict';

  /* ---------- Detect folder depth ---------- */
  const inGameplayFolder = /\/Gameplay\//i.test(window.location.pathname);
  const base = inGameplayFolder ? '../' : '';

  /* ---------- Detect current page ---------- */
  const path = window.location.pathname.toLowerCase();
  const isSubject  = /subject\.html$/.test(path);
  const isLevel    = /level\.html$/.test(path);
  const isGameplay = /gameplay-/.test(path);

  /* ============================================================
     COMMON ASSETS
     ============================================================ */
  const SUBJECT_IMAGES = [
    base + 'Assets/subject/computer_t.png',
    base + 'Assets/subject/sci_sub.png',
    base + 'Assets/subject/ap_sub.png'
  ];

  const LEVEL_IMAGES = [
    base + 'Assets/Platform_Island.png',
    base + 'Assets/jojoma.png',
    base + 'Assets/island_castle.png',
    base + 'Assets/single_island.png'
  ];

  /* ============================================================
     EXACT VERIFIED CARD ASSET MANIFEST (All 30 Levels)
     Exact disk filenames & casing to prevent 404s on Linux/Vercel
     ============================================================ */
  const ASSET_MANIFEST = {
  "ap": {
    "1": {
      "Pacific Ocean": {
        "img": "Assets/topic/AP/level 1/pacific ocean.avif",
        "sound": "Assets/sound/AP/1/pacific ocean.m4a"
      },
      "Pasig River": {
        "img": "Assets/topic/AP/level 1/pasig river.jpg",
        "sound": "Assets/sound/AP/1/pasig river.m4a"
      },
      "Laguna de Bay": {
        "img": "Assets/topic/AP/level 1/laguna debay.jpg",
        "sound": "Assets/sound/AP/1/laguna de bay.m4a"
      }
    },
    "2": {
      "Mount Apo": {
        "img": "Assets/topic/AP/level 2/Mount-Apo-.webp",
        "sound": "Assets/sound/AP/2/mount apo.m4a"
      },
      "Mayon Volcano": {
        "img": "Assets/topic/AP/level 2/mayon.jpg",
        "sound": "Assets/sound/AP/2/mayon volcano.m4a"
      },
      "Chocolate Hills": {
        "img": "Assets/topic/AP/level 2/chocolate hills.png",
        "sound": "Assets/sound/AP/2/chocolate hills.m4a"
      },
      "Central Luzon Plain": {
        "img": "Assets/topic/AP/level 2/Central Luzon Plain.jpg",
        "sound": "Assets/sound/AP/2/Central Luzon Plain.m4a"
      }
    },
    "3": {
      "Malaysia": {
        "img": "Assets/topic/AP/level 3/malaysia.webp",
        "sound": "Assets/sound/AP/3/malaysia.m4a"
      },
      "Indonesia": {
        "img": "Assets/topic/AP/level 3/indonesia.webp",
        "sound": "Assets/sound/AP/3/Indonesia.m4a"
      },
      "Vietnam": {
        "img": "Assets/topic/AP/level 3/Vietnam.webp",
        "sound": "Assets/sound/AP/3/Vietnam.m4a"
      },
      "Thailand": {
        "img": "Assets/topic/AP/level 3/thailand.webp",
        "sound": "Assets/sound/AP/3/Thailand.m4a"
      },
      "Brunei": {
        "img": "Assets/topic/AP/level 3/brunei.webp",
        "sound": "Assets/sound/AP/3/Brunei.m4a"
      }
    },
    "4": {
      "Weather": {
        "img": "Assets/topic/AP/level 4/weather.jpg",
        "sound": "Assets/sound/AP/4/weather.m4a"
      },
      "Climate": {
        "img": "Assets/topic/AP/level 4/climate.avif",
        "sound": "Assets/sound/AP/4/climate.m4a"
      },
      "Temperature": {
        "img": "Assets/topic/AP/level 4/temperature.avif",
        "sound": "Assets/sound/AP/4/temperature.m4a"
      },
      "Humidity": {
        "img": "Assets/topic/AP/level 4/humidity.webp",
        "sound": "Assets/sound/AP/4/humidity.m4a"
      },
      "Rainfall": {
        "img": "Assets/topic/AP/level 4/rainfall.jpg",
        "sound": "Assets/sound/AP/4/rainfall.m4a"
      },
      "PAGASA": {
        "img": "Assets/topic/AP/level 4/pagasa.jpg",
        "sound": "Assets/sound/AP/4/PAGASA.m4a"
      }
    },
    "5": {
      "Rainy season": {
        "img": "Assets/topic/AP/level 5/rainy season.jpg",
        "sound": "Assets/sound/AP/5/rainy season.m4a"
      },
      "Dry season": {
        "img": "Assets/topic/AP/level 5/dry season2.jpg",
        "sound": "Assets/sound/AP/5/dry season.m4a"
      },
      "Cool dry season": {
        "img": "Assets/topic/AP/level 5/Cool dry season.jpg",
        "sound": "Assets/sound/AP/5/cool dry season.m4a"
      },
      "Hot dry season": {
        "img": "Assets/topic/AP/level 5/hot season.jpg",
        "sound": "Assets/sound/AP/5/hot dry season.m4a"
      },
      "May": {
        "img": "Assets/topic/AP/level 5/hottest  month.jpg",
        "sound": "Assets/sound/AP/5/hottest month.m4a"
      },
      "January": {
        "img": "Assets/topic/AP/level 5/coolest.jpg",
        "sound": "Assets/sound/AP/5/coolest month.m4a"
      },
      "Tropical climate": {
        "img": "Assets/topic/AP/level 5/Tropical climate.jpg",
        "sound": "Assets/sound/AP/5/tropical climate.m4a"
      }
    },
    "6": {
      "Luzon": {
        "img": "Assets/topic/AP/level 6/Luzon.jpg",
        "sound": "Assets/sound/AP/6/Luzon.m4a"
      },
      "Visayas": {
        "img": "Assets/topic/AP/level 6/visaya.jpg",
        "sound": "Assets/sound/AP/6/visayas.m4a"
      },
      "Mindanao": {
        "img": "Assets/topic/AP/level 6/mindanao.jpg",
        "sound": "Assets/sound/AP/6/Mindanao.m4a"
      },
      "Palawan": {
        "img": "Assets/topic/AP/level 6/palawan.jpg",
        "sound": "Assets/sound/AP/6/palawan.m4a"
      },
      "Mindoro": {
        "img": "Assets/topic/AP/level 6/mindoro.jpg",
        "sound": "Assets/sound/AP/6/mindoro.m4a"
      },
      "Samar": {
        "img": "Assets/topic/AP/level 6/Samar.jpg",
        "sound": "Assets/sound/AP/6/samar.m4a"
      },
      "Leyte": {
        "img": "Assets/topic/AP/level 6/Leyte.jpg",
        "sound": "Assets/sound/AP/6/leyte.m4a"
      },
      "Cebu": {
        "img": "Assets/topic/AP/level 6/cebu.jpg",
        "sound": "Assets/sound/AP/6/cebu.m4a"
      }
    },
    "7": {
      "Mount Pulag": {
        "img": "Assets/topic/AP/level 7/Mount Pulag.jpg",
        "sound": "Assets/sound/AP/7/mount pulag.m4a"
      },
      "Mount Pinatubo": {
        "img": "Assets/topic/AP/level 7/Mount Pinatubo.jpg",
        "sound": "Assets/sound/AP/7/mount pinatubo.m4a"
      },
      "Taal Volcano": {
        "img": "Assets/topic/AP/level 7/Taal Volcano.jpg",
        "sound": "Assets/sound/AP/7/taal volcano.m4a"
      },
      "Cagayan River": {
        "img": "Assets/topic/AP/level 7/Cagayan River.jpg",
        "sound": "Assets/sound/AP/7/cagayan river.m4a"
      },
      "Agusan River": {
        "img": "Assets/topic/AP/level 7/Agusan River.jpg",
        "sound": "Assets/sound/AP/7/agusan river.m4a"
      },
      "Lake Lanao": {
        "img": "Assets/topic/AP/level 7/Lake Lanao.jpg",
        "sound": "Assets/sound/AP/7/lake lanao.m4a"
      },
      "Subic Bay": {
        "img": "Assets/topic/AP/level 7/Subic Bay.jpg",
        "sound": "Assets/sound/AP/7/subic bay.m4a"
      },
      "Davao Gulf": {
        "img": "Assets/topic/AP/level 7/Davao Gulf.jpg",
        "sound": "Assets/sound/AP/7/davao gulf.m4a"
      },
      "Sibuyan Sea": {
        "img": "Assets/topic/AP/level 7/Sibuyan Sea.webp",
        "sound": "Assets/sound/AP/7/sibuyan sea.m4a"
      }
    },
    "8": {
      "Datu": {
        "img": "Assets/topic/AP/level 8/Datu (chief).jpg",
        "sound": "Assets/sound/AP/8/datu.m4a"
      },
      "Maharlika": {
        "img": "Assets/topic/AP/level 8/Maharlika (noble).jpg",
        "sound": "Assets/sound/AP/8/maharlika.m4a"
      },
      "Timawa": {
        "img": "Assets/topic/AP/level 8/Timawa (freeman).jpg",
        "sound": "Assets/sound/AP/8/timawa.m4a"
      },
      "Babaylan": {
        "img": "Assets/topic/AP/level 8/Babaylan (spiritual leader.jpg",
        "sound": "Assets/sound/AP/8/babaylan.m4a"
      },
      "Balangay": {
        "img": "Assets/topic/AP/level 8/Balangay (boat).jpg",
        "sound": "Assets/sound/AP/8/balangay.m4a"
      },
      "Baybayin": {
        "img": "Assets/topic/AP/level 8/Baybayin (ancient writing).jpg",
        "sound": "Assets/sound/AP/8/baybayin.m4a"
      },
      "Bahay Kubo": {
        "img": "Assets/topic/AP/level 8/Bahay Kubo.jpg",
        "sound": "Assets/sound/AP/8/bahay kubo.m4a"
      },
      "Panday": {
        "img": "Assets/topic/AP/level 8/Panday (blacksmith).jpg",
        "sound": "Assets/sound/AP/8/panday.m4a"
      }
    },
    "9": {
      "Manunggul Jar": {
        "img": "Assets/topic/AP/level 9/Manunggul Jar.jpg",
        "sound": "Assets/sound/AP/9/mangunggul jar.m4a"
      },
      "Banaue Rice Terraces": {
        "img": "Assets/topic/AP/level 9/Banaue Rice Terraces.jpg",
        "sound": "Assets/sound/AP/9/banaue rice terrace.m4a"
      },
      "Bulul": {
        "img": "Assets/topic/AP/level 9/Bulul.jpg",
        "sound": "Assets/sound/AP/9/bulul.m4a"
      },
      "Laguna Copperplate": {
        "img": "Assets/topic/AP/level 9/Laguna Copperplate Inscription.jpg",
        "sound": "Assets/sound/AP/9/Laguna Copperplate Inscription.m4a"
      },
      "Golden Tara": {
        "img": "Assets/topic/AP/level 9/Golden Tara of Agusan.jpg",
        "sound": "Assets/sound/AP/9/Golden Tara of Agusan.m4a"
      },
      "Tabon Cave": {
        "img": "Assets/topic/AP/level 9/Tabon Cave.jpg",
        "sound": "Assets/sound/AP/9/tabon cave.m4a"
      },
      "Angono Petroglyphs": {
        "img": "Assets/topic/AP/level 9/Angono Petroglyphs.jpg",
        "sound": "Assets/sound/AP/9/angono petroglyphs.m4a"
      },
      "Fort Santiago": {
        "img": "Assets/topic/AP/level 9/Fort Santiago.jpg",
        "sound": "Assets/sound/AP/9/fort santiago.m4a"
      },
      "San Agustin Church": {
        "img": "Assets/topic/AP/level 9/San Agustin Church.jpg",
        "sound": "Assets/sound/AP/9/san agustin church.m4a"
      },
      "Bahay na Bato": {
        "img": "Assets/topic/AP/level 9/Bahay na Bato.jpg",
        "sound": "Assets/sound/AP/9/bahay na bato.m4a"
      },
      "Barasoain Church": {
        "img": "Assets/topic/AP/level 9/Barasoain Church.jpg",
        "sound": "Assets/sound/AP/9/barasoain church.m4a"
      }
    },
    "10": {
      "Hudhud": {
        "img": "Assets/topic/AP/level 10/hudhud.PNG",
        "sound": "Assets/sound/AP/10/hudhud.m4a"
      },
      "Biag ni Lam-ang": {
        "img": "Assets/topic/AP/level 10/Biag ni Lam-ang.jpg",
        "sound": "Assets/sound/AP/10/biag ni lim-ang.m4a"
      },
      "Alamat": {
        "img": "Assets/topic/AP/level 10/Alamat.jpg",
        "sound": "Assets/sound/AP/10/alamat.m4a"
      },
      "Bugtong": {
        "img": "Assets/topic/AP/level 10/Bugtong.jpg",
        "sound": "Assets/sound/AP/10/bugtong.m4a"
      },
      "Salawikain": {
        "img": "Assets/topic/AP/level 10/Salawikain.jpg",
        "sound": "Assets/sound/AP/10/salawikain.m4a"
      },
      "Kundiman": {
        "img": "Assets/topic/AP/level 10/Kundiman.jpg",
        "sound": "Assets/sound/AP/10/kundiman.m4a"
      },
      "Tinikling": {
        "img": "Assets/topic/AP/level 10/Tinikling.jpg",
        "sound": "Assets/sound/AP/10/tinikling.m4a"
      },
      "Singkil": {
        "img": "Assets/topic/AP/level 10/Singkil (dance).jpg",
        "sound": "Assets/sound/AP/10/singkil.m4a"
      },
      "Pandanggo sa Ilaw": {
        "img": "Assets/topic/AP/level 10/Pandanggo sa Ilaw (dance).jpg",
        "sound": "Assets/sound/AP/10/Pandanggo sa Ilaw.m4a"
      },
      "Fiesta": {
        "img": "Assets/topic/AP/level 10/Fiesta.jpg",
        "sound": "Assets/sound/AP/10/fiesta.m4a"
      },
      "Pamahiin": {
        "img": "Assets/topic/AP/level 10/Pamahiin (superstition).jpg",
        "sound": "Assets/sound/AP/10/pamahiin.m4a"
      },
      "Mano po": {
        "img": "Assets/topic/AP/level 10/Mano po (respect gesture).jpg",
        "sound": "Assets/sound/AP/10/mano po.m4a"
      }
    }
  },
  "computer": {
    "1": {
      "Google": {
        "img": "Assets/topic/EPP/lvl1/google.jpg",
        "sound": "Assets/sound/epp/1/google.m4a"
      },
      "Yahoo": {
        "img": "Assets/topic/EPP/lvl1/yahoo.jpg",
        "sound": "Assets/sound/epp/1/yahoo.m4a"
      },
      "Lycos": {
        "img": "Assets/topic/EPP/lvl1/lycos.jpg",
        "sound": "Assets/sound/epp/1/lycos.m4a"
      }
    },
    "2": {
      "Search box": {
        "img": "Assets/topic/EPP/lvl2/search box.jpg",
        "sound": "Assets/sound/epp/2/search box.m4a"
      },
      "Search button": {
        "img": "Assets/topic/EPP/lvl2/search button.jpg",
        "sound": "Assets/sound/epp/2/search button.m4a"
      },
      "Search results": {
        "img": "Assets/topic/EPP/lvl2/search result.jpg",
        "sound": "Assets/sound/epp/2/search results.m4a"
      },
      "Tabs": {
        "img": "Assets/topic/EPP/lvl2/tabs.jpg",
        "sound": "Assets/sound/epp/2/tabs.m4a"
      }
    },
    "3": {
      "Safari": {
        "img": "Assets/topic/EPP/lvl3/safari.jpg",
        "sound": "Assets/sound/epp/3/safari.m4a"
      },
      "Opera": {
        "img": "Assets/topic/EPP/lvl3/opera.jpg",
        "sound": "Assets/sound/epp/3/opera.m4a"
      },
      "Microsoft Edge": {
        "img": "Assets/topic/EPP/lvl3/microsoft edge.jpg",
        "sound": "Assets/sound/epp/3/Microsoft edge.m4a"
      },
      "Mozilla Firefox": {
        "img": "Assets/topic/EPP/lvl3/mozilla firefox.jpg",
        "sound": "Assets/sound/epp/3/Mozilla Firefox.m4a"
      },
      "Google Chrome": {
        "img": "Assets/topic/EPP/lvl3/google chrome.jpg",
        "sound": "Assets/sound/epp/3/google chrome.m4a"
      }
    },
    "4": {
      "Email": {
        "img": "Assets/topic/EPP/lvl4/email.jpg",
        "sound": "Assets/sound/epp/4/email.m4a"
      },
      "Chat": {
        "img": "Assets/topic/EPP/lvl4/chat.jpg",
        "sound": "Assets/sound/epp/4/chat.m4a"
      },
      "Instant message": {
        "img": "Assets/topic/EPP/lvl4/Instant message.jpg",
        "sound": "Assets/sound/epp/4/instant message.m4a"
      },
      "Video call": {
        "img": "Assets/topic/EPP/lvl4/videocall.jpg",
        "sound": "Assets/sound/epp/4/video call.m4a"
      },
      "Social media": {
        "img": "Assets/topic/EPP/lvl4/social media.jpg",
        "sound": "Assets/sound/epp/4/social media.m4a"
      },
      "Online class": {
        "img": "Assets/topic/EPP/lvl4/onlineclass.jpg",
        "sound": "Assets/sound/epp/4/online class.m4a"
      }
    },
    "5": {
      "Kind words": {
        "img": "Assets/topic/EPP/lvl5/kind words.jpg",
        "sound": "Assets/sound/epp/5/use kind words.m4a"
      },
      "Ask permission": {
        "img": "Assets/topic/EPP/lvl5/Ask permission before posting others_ photos .jpg",
        "sound": "Assets/sound/epp/5/Ask permission before posting others_ photos.m4a"
      },
      "Be respectful": {
        "img": "Assets/topic/EPP/lvl5/Be respectful in online class .jpg",
        "sound": "Assets/sound/epp/5/be respectful.m4a"
      },
      "Typing in ALL CAPS": {
        "img": "Assets/topic/EPP/lvl5/Typing in ALL CAPS.jpg",
        "sound": "Assets/sound/epp/5/typing in all caps.m4a"
      },
      "Sharing password": {
        "img": "Assets/topic/EPP/lvl5/Sharing password.jpg",
        "sound": "Assets/sound/epp/5/sharing your password.m4a"
      },
      "Using bad words": {
        "img": "Assets/topic/EPP/lvl5/Using bad words.jpg",
        "sound": "Assets/sound/epp/5/using bad words.m4a"
      },
      "Fake news": {
        "img": "Assets/topic/EPP/lvl5/fake news.jpg",
        "sound": "Assets/sound/epp/5/spreading fake news.m4a"
      }
    },
    "6": {
      "com": {
        "img": "Assets/topic/EPP/lvl6/com.jpg",
        "sound": "Assets/sound/epp/6/com.m4a"
      },
      "edu": {
        "img": "Assets/topic/EPP/lvl6/edu.jpg",
        "sound": "Assets/sound/epp/6/edu.m4a"
      },
      "gov": {
        "img": "Assets/topic/EPP/lvl6/gov.jpg",
        "sound": "Assets/sound/epp/6/gov.m4a"
      },
      "info": {
        "img": "Assets/topic/EPP/lvl6/info.jpg",
        "sound": "Assets/sound/epp/6/info.m4a"
      },
      "int": {
        "img": "Assets/topic/EPP/lvl6/int.jpg",
        "sound": "Assets/sound/epp/6/int.m4a"
      },
      "net": {
        "img": "Assets/topic/EPP/lvl6/net.jpg",
        "sound": "Assets/sound/epp/6/net.m4a"
      },
      "org": {
        "img": "Assets/topic/EPP/lvl6/org.jpg",
        "sound": "Assets/sound/epp/6/org.m4a"
      },
      "pro": {
        "img": "Assets/topic/EPP/lvl6/pro.jpg",
        "sound": "Assets/sound/epp/6/pro.m4a"
      },
      "proj": {
        "img": "Assets/topic/EPP/lvl6/pro.jpg",
        "sound": "Assets/sound/epp/6/pro.m4a"
      }
    },
    "7": {
      "Browser window buttons": {
        "img": "Assets/topic/EPP/lvl7/Browser window buttons.png",
        "sound": "Assets/sound/epp/7/browser window button.m4a"
      },
      "Tab name": {
        "img": "Assets/topic/EPP/lvl7/tab name.png",
        "sound": "Assets/sound/epp/7/tab name.m4a"
      },
      "Navigation buttons": {
        "img": "Assets/topic/EPP/lvl7/navigation button.png",
        "sound": "Assets/sound/epp/7/navigation buttons.m4a"
      },
      "New tab": {
        "img": "Assets/topic/EPP/lvl7/new tab.png",
        "sound": "Assets/sound/epp/7/new tab.m4a"
      },
      "Customize and control": {
        "img": "Assets/topic/EPP/lvl7/tabs.png",
        "sound": "Assets/sound/epp/7/customize and control.m4a"
      },
      "Bookmark this page": {
        "img": "Assets/topic/EPP/lvl7/book mark.png",
        "sound": "Assets/sound/epp/7/bookmark.m4a"
      },
      "Address bar": {
        "img": "Assets/topic/EPP/lvl7/adress bar.png",
        "sound": "Assets/sound/epp/7/address bar.m4a"
      },
      "Display window": {
        "img": "Assets/topic/EPP/lvl7/Display window buttons.png",
        "sound": "Assets/sound/epp/7/display window.m4a"
      },
      "Scroll bar": {
        "img": "Assets/topic/EPP/lvl7/scroll bar.png",
        "sound": "Assets/sound/epp/7/scroll bar.m4a"
      }
    },
    "8": {
      "Username": {
        "img": "Assets/topic/EPP/lvl8/usenname.png",
        "sound": "Assets/sound/epp/8/username.m4a"
      },
      "Domain name": {
        "img": "Assets/topic/EPP/lvl8/domainname.png",
        "sound": "Assets/sound/epp/8/domain name.m4a"
      },
      "Domain type": {
        "img": "Assets/topic/EPP/lvl8/domain type.png",
        "sound": "Assets/sound/epp/8/domain type.m4a"
      },
      "To": {
        "img": "Assets/topic/EPP/lvl8/to.png",
        "sound": "Assets/sound/epp/8/to.m4a"
      },
      "Cc": {
        "img": "Assets/topic/EPP/lvl8/cc.png",
        "sound": "Assets/sound/epp/8/Cc.m4a"
      },
      "Bcc": {
        "img": "Assets/topic/EPP/lvl8/bcc.png",
        "sound": "Assets/sound/epp/8/Bcc.m4a"
      },
      "Subject": {
        "img": "Assets/topic/EPP/lvl8/subject_.png",
        "sound": "Assets/sound/epp/8/subject.m4a"
      },
      "Forward": {
        "img": "Assets/topic/EPP/lvl8/forward.png",
        "sound": "Assets/sound/epp/9/forward.m4a"
      },
      "Send": {
        "img": "Assets/topic/EPP/lvl8/send.png",
        "sound": "Assets/sound/epp/8/send.m4a"
      }
    },
    "9": {
      "Gmail": {
        "img": "Assets/topic/EPP/lvl9/gmail.png",
        "sound": "Assets/sound/epp/9/gmail.m4a"
      },
      "Yahoo Mail": {
        "img": "Assets/topic/EPP/lvl9/yahoo mail.png",
        "sound": "Assets/sound/epp/9/yahoo mail.m4a"
      },
      "Outlook": {
        "img": "Assets/topic/EPP/lvl9/out look.png",
        "sound": "Assets/sound/epp/9/outlook.m4a"
      },
      "Compose Mail": {
        "img": "Assets/topic/EPP/lvl9/compose mail.png",
        "sound": "Assets/sound/epp/9/compose mail.m4a"
      },
      "Inbox": {
        "img": "Assets/topic/EPP/lvl9/inbox.png",
        "sound": "Assets/sound/epp/9/inbox.m4a"
      },
      "Sent": {
        "img": "Assets/topic/EPP/lvl9/send.png",
        "sound": "Assets/sound/epp/9/sent.m4a"
      },
      "Drafts": {
        "img": "Assets/topic/EPP/lvl9/draft.png",
        "sound": "Assets/sound/epp/9/draft.m4a"
      },
      "Spam": {
        "img": "Assets/topic/EPP/lvl9/spam.png",
        "sound": "Assets/sound/epp/9/spam.m4a"
      },
      "Attachment": {
        "img": "Assets/topic/EPP/lvl9/attachfile.png",
        "sound": "Assets/sound/epp/9/attachment.m4a"
      },
      "Reply": {
        "img": "Assets/topic/EPP/lvl9/reply.png",
        "sound": "Assets/sound/epp/9/reply.m4a"
      },
      "Forward": {
        "img": "Assets/topic/EPP/lvl9/forward.png",
        "sound": "Assets/sound/epp/9/forward.m4a"
      }
    },
    "10": {
      "Monitor": {
        "img": "Assets/topic/EPP/lvl10/monitor.png",
        "sound": "Assets/sound/epp/10/monitor.m4a"
      },
      "Keyboard": {
        "img": "Assets/topic/EPP/lvl10/keyboard.png",
        "sound": "Assets/sound/epp/10/keyboard.m4a"
      },
      "Mouse": {
        "img": "Assets/topic/EPP/lvl10/mouse.png",
        "sound": null
      },
      "System unit": {
        "img": "Assets/topic/EPP/lvl10/system unit.png",
        "sound": "Assets/sound/epp/10/system unit.m4a"
      },
      "Speakers": {
        "img": "Assets/topic/EPP/lvl10/speaker.png",
        "sound": "Assets/sound/epp/10/speakers.m4a"
      },
      "Printer": {
        "img": "Assets/topic/EPP/lvl10/printer_.png",
        "sound": "Assets/sound/epp/10/printer.m4a"
      },
      "Webcam": {
        "img": "Assets/topic/EPP/lvl10/webcam_.png",
        "sound": "Assets/sound/epp/10/webcam.m4a"
      },
      "Microphone": {
        "img": "Assets/topic/EPP/lvl10/microphone.png",
        "sound": null
      },
      "Headset": {
        "img": "Assets/topic/EPP/lvl10/headset.png",
        "sound": "Assets/sound/epp/10/headset.m4a"
      },
      "Scanner": {
        "img": "Assets/topic/EPP/lvl10/scanner.png",
        "sound": "Assets/sound/epp/10/scanner.m4a"
      },
      "USB flash drive": {
        "img": "Assets/topic/EPP/lvl10/usb_flashdrive.png",
        "sound": "Assets/sound/epp/10/usb flash drive.m4a"
      },
      "Touchpad": {
        "img": "Assets/topic/EPP/lvl10/touch pad.png",
        "sound": "Assets/sound/epp/10/touch pad.m4a"
      }
    }
  },
  "science": {
    "1": {
      "Rock": {
        "img": "Assets/topic/SCIENCE/Level 1/Rock.jpg",
        "sound": "Assets/sound/science/1/rock.m4a"
      },
      "Water": {
        "img": "Assets/topic/SCIENCE/Level 1/Water.jpg",
        "sound": "Assets/sound/science/1/water.m4a"
      },
      "Air": {
        "img": "Assets/topic/SCIENCE/Level 1/Air.jpg",
        "sound": "Assets/sound/science/1/air.m4a"
      }
    },
    "2": {
      "Chair": {
        "img": "Assets/topic/SCIENCE/Level 2/Chair.jpg",
        "sound": "Assets/sound/science/2/chair.m4a"
      },
      "Desk": {
        "img": "Assets/topic/SCIENCE/Level 2/Desk.jpg",
        "sound": "Assets/sound/science/2/desk.m4a"
      },
      "Bag": {
        "img": "Assets/topic/SCIENCE/Level 2/Bag.jpg",
        "sound": "Assets/sound/science/2/bag.m4a"
      },
      "Shoes": {
        "img": "Assets/topic/SCIENCE/Level 2/Shoes.jpg",
        "sound": "Assets/sound/science/2/shoes.m4a"
      }
    },
    "3": {
      "Water": {
        "img": "Assets/topic/SCIENCE/Level 3/water.jpg",
        "sound": "Assets/sound/science/3/waterr.m4a"
      },
      "Coffee": {
        "img": "Assets/topic/SCIENCE/Level 3/coffee.jpg",
        "sound": "Assets/sound/science/3/coffee.m4a"
      },
      "Chocolate drink": {
        "img": "Assets/topic/SCIENCE/Level 3/chocolate_.jpg",
        "sound": "Assets/sound/science/3/chocolate drink.m4a"
      },
      "Juice": {
        "img": "Assets/topic/SCIENCE/Level 3/juice.jpg",
        "sound": "Assets/sound/science/3/juice.m4a"
      },
      "Milk": {
        "img": "Assets/topic/SCIENCE/Level 3/milk.jpg",
        "sound": "Assets/sound/science/3/milk.m4a"
      }
    },
    "4": {
      "Air": {
        "img": "Assets/topic/SCIENCE/Level 4/air.jpg",
        "sound": "Assets/sound/science/4/airr.m4a"
      },
      "Wind": {
        "img": "Assets/topic/SCIENCE/Level 4/wind.jpg",
        "sound": "Assets/sound/science/4/wind.m4a"
      },
      "Oxygen": {
        "img": "Assets/topic/SCIENCE/Level 4/Oxygen_.jpg",
        "sound": "Assets/sound/science/4/oxygen.m4a"
      },
      "Carbon dioxide": {
        "img": "Assets/topic/SCIENCE/Level 4/carbon.jpg",
        "sound": "Assets/sound/science/4/carbon dioxide.m4a"
      },
      "Water vapor": {
        "img": "Assets/topic/SCIENCE/Level 4/vapor.jpg",
        "sound": "Assets/sound/science/4/water vapor.m4a"
      },
      "Helium": {
        "img": "Assets/topic/SCIENCE/Level 4/helium_.jpg",
        "sound": "Assets/sound/science/4/hellum.m4a"
      }
    },
    "5": {
      "Mass": {
        "img": "Assets/topic/SCIENCE/Level 5/mass_.png",
        "sound": "Assets/sound/science/5/mass.m4a"
      },
      "Weight": {
        "img": "Assets/topic/SCIENCE/Level 5/weight_.jpg",
        "sound": "Assets/sound/science/5/weight.m4a"
      },
      "Volume": {
        "img": "Assets/topic/SCIENCE/Level 5/volume_.jpg",
        "sound": "Assets/sound/science/5/volume.m4a"
      },
      "Shape": {
        "img": "Assets/topic/SCIENCE/Level 5/shape_.jpg",
        "sound": "Assets/sound/science/5/shape.m4a"
      },
      "Color": {
        "img": "Assets/topic/SCIENCE/Level 5/color.jpg",
        "sound": "Assets/sound/science/5/color.m4a"
      },
      "Texture": {
        "img": "Assets/topic/SCIENCE/Level 5/texture_.jpg",
        "sound": "Assets/sound/science/5/twxture.m4a"
      },
      "Smell": {
        "img": "Assets/topic/SCIENCE/Level 5/smell.jpg",
        "sound": "Assets/sound/science/5/smell.m4a"
      }
    },
    "6": {
      "Platform balance": {
        "img": "Assets/topic/SCIENCE/Level 6/platform_.jpg",
        "sound": "Assets/sound/science/6/platform balance.m4a"
      },
      "Triple beam balance": {
        "img": "Assets/topic/SCIENCE/Level 6/triple beam.jpg",
        "sound": "Assets/sound/science/6/triple beam balance.m4a"
      },
      "Weighing scale": {
        "img": "Assets/topic/SCIENCE/Level 6/weighted scale.jpg",
        "sound": "Assets/sound/science/6/Weighing scale.m4a"
      },
      "Graduated cylinder": {
        "img": "Assets/topic/SCIENCE/Level 6/cylinder_.jpg",
        "sound": "Assets/sound/science/6/graduated cylinder.m4a"
      },
      "Meter stick": {
        "img": "Assets/topic/SCIENCE/Level 6/meter stick_.jpg",
        "sound": "Assets/sound/science/6/meter stick.m4a"
      },
      "Thermometer": {
        "img": "Assets/topic/SCIENCE/Level 6/thermometer_.jpg",
        "sound": "Assets/sound/science/6/thermometer.m4a"
      },
      "Measuring cup": {
        "img": "Assets/topic/SCIENCE/Level 6/measuring cup.jpg",
        "sound": "Assets/sound/science/6/measuring cup.m4a"
      },
      "Beaker": {
        "img": "Assets/topic/SCIENCE/Level 6/beaker.jpg",
        "sound": "Assets/sound/science/6/beaker.m4a"
      }
    },
    "7": {
      "Gram": {
        "img": "Assets/topic/SCIENCE/Level 7/gram.jpg",
        "sound": "Assets/sound/science/7/gram.m4a"
      },
      "Kilogram": {
        "img": "Assets/topic/SCIENCE/Level 7/kg.jpg",
        "sound": "Assets/sound/science/7/kg.m4a"
      },
      "Milliliter": {
        "img": "Assets/topic/SCIENCE/Level 7/milliliter_.jpg",
        "sound": "Assets/sound/science/7/milliliter.m4a"
      },
      "Liter": {
        "img": "Assets/topic/SCIENCE/Level 7/liter.jpg",
        "sound": "Assets/sound/science/7/liter.m4a"
      },
      "Centimeter": {
        "img": "Assets/topic/SCIENCE/Level 7/cm.jpg",
        "sound": "Assets/sound/science/7/cm.m4a"
      },
      "Meter": {
        "img": "Assets/topic/SCIENCE/Level 7/meter.jpg",
        "sound": "Assets/sound/science/7/meter.m4a"
      },
      "Cubic centimeter": {
        "img": "Assets/topic/SCIENCE/Level 7/Cubic-Centimeters-to-Liters.png",
        "sound": "Assets/sound/science/7/cubic centimeter.m4a"
      },
      "Degree Celsius": {
        "img": "Assets/topic/SCIENCE/Level 7/degree.jpg",
        "sound": "Assets/sound/science/7/degree Celsius.m4a"
      },
      "Cubic meter": {
        "img": "Assets/topic/SCIENCE/Level 7/cubic meter.jpg",
        "sound": "Assets/sound/science/7/cubic meter.m4a"
      }
    },
    "8": {
      "Melting": {
        "img": "Assets/topic/SCIENCE/Level 8/melting.jpg",
        "sound": "Assets/sound/science/8/melting.m4a"
      },
      "Freezing": {
        "img": "Assets/topic/SCIENCE/Level 8/freeze.jpg",
        "sound": "Assets/sound/science/8/freezing.m4a"
      },
      "Evaporation": {
        "img": "Assets/topic/SCIENCE/Level 8/evaporation_.jpg",
        "sound": "Assets/sound/science/8/evaporation.m4a"
      },
      "Condensation": {
        "img": "Assets/topic/SCIENCE/Level 8/condensation_.jpg",
        "sound": "Assets/sound/science/8/condensation.m4a"
      },
      "Boiling": {
        "img": "Assets/topic/SCIENCE/Level 8/boiling_.jpg",
        "sound": "Assets/sound/science/8/boilimg.m4a"
      },
      "Cutting paper": {
        "img": "Assets/topic/SCIENCE/Level 8/cut.jpg",
        "sound": "Assets/sound/science/8/cutting paper.m4a"
      },
      "Tearing paper": {
        "img": "Assets/topic/SCIENCE/Level 8/tearing.jpg",
        "sound": "Assets/sound/science/8/tearing paper.m4a"
      },
      "Crushing a can": {
        "img": "Assets/topic/SCIENCE/Level 8/can.jpg",
        "sound": "Assets/sound/science/8/crushing a can.m4a"
      },
      "Dissolving sugar": {
        "img": "Assets/topic/SCIENCE/Level 8/sugar.jpg",
        "sound": "Assets/sound/science/8/dissolving sugar.m4a"
      },
      "Folding paper": {
        "img": "Assets/topic/SCIENCE/Level 8/fold.jpg",
        "sound": "Assets/sound/science/8/folding paper.m4a"
      }
    },
    "9": {
      "Mouth": {
        "img": "Assets/topic/SCIENCE/Level 9/mouth.jpg",
        "sound": "Assets/sound/science/9/mouth.m4a"
      },
      "Teeth": {
        "img": "Assets/topic/SCIENCE/Level 9/teeth_.jpg",
        "sound": "Assets/sound/science/9/teeth.m4a"
      },
      "Salivary glands": {
        "img": "Assets/topic/SCIENCE/Level 9/glands.jpg",
        "sound": "Assets/sound/science/9/salivary glands.m4a"
      },
      "Esophagus": {
        "img": "Assets/topic/SCIENCE/Level 9/esophagus_.jpg",
        "sound": "Assets/sound/science/9/esophagus.m4a"
      },
      "Liver": {
        "img": "Assets/topic/SCIENCE/Level 9/liver.jpg",
        "sound": "Assets/sound/science/9/liver.m4a"
      },
      "Gallbladder": {
        "img": "Assets/topic/SCIENCE/Level 9/gallblader.jpg",
        "sound": "Assets/sound/science/9/gallbladder.m4a"
      },
      "Pancreas": {
        "img": "Assets/topic/SCIENCE/Level 9/pancreas.jpg",
        "sound": "Assets/sound/science/9/pancreas.m4a"
      },
      "Small intestine": {
        "img": "Assets/topic/SCIENCE/Level 9/small.jpg",
        "sound": "Assets/sound/science/9/small intestine.m4a"
      },
      "Large intestine": {
        "img": "Assets/topic/SCIENCE/Level 9/large_.jpg",
        "sound": "Assets/sound/science/9/large intestine.m4a"
      },
      "Rectum": {
        "img": "Assets/topic/SCIENCE/Level 9/rectum.jpg",
        "sound": "Assets/sound/science/9/rectum.m4a"
      }
    },
    "10": {
      "Nose": {
        "img": "Assets/topic/SCIENCE/Level 10/nose.jpg",
        "sound": "Assets/sound/science/10/nose.m4a"
      },
      "Nasal cavity": {
        "img": "Assets/topic/SCIENCE/Level 10/nasal.jpg",
        "sound": "Assets/sound/science/10/nasal cavity.m4a"
      },
      "Mouth": {
        "img": "Assets/topic/SCIENCE/Level 10/mouth.jpg",
        "sound": "Assets/sound/science/10/mouthh.m4a"
      },
      "Pharynx": {
        "img": "Assets/topic/SCIENCE/Level 10/pharxn.jpg",
        "sound": "Assets/sound/science/10/Pharynx.m4a"
      },
      "Larynx": {
        "img": "Assets/topic/SCIENCE/Level 10/larynx.jpg",
        "sound": "Assets/sound/science/10/Larynx.m4a"
      },
      "Trachea": {
        "img": "Assets/topic/SCIENCE/Level 10/trachea.jpg",
        "sound": "Assets/sound/science/10/Trachea.m4a"
      },
      "Bronchi": {
        "img": "Assets/topic/SCIENCE/Level 10/bronchi.jpg",
        "sound": "Assets/sound/science/10/Bronchi.m4a"
      },
      "Bronchioles": {
        "img": "Assets/topic/SCIENCE/Level 10/bronchiolos.jpg",
        "sound": "Assets/sound/science/10/Bronchioles.m4a"
      },
      "Alveoli": {
        "img": "Assets/topic/SCIENCE/Level 10/alveolar_.jpg",
        "sound": "Assets/sound/science/10/Alveoli.m4a"
      },
      "Lungs": {
        "img": "Assets/topic/SCIENCE/Level 10/lungs.jpg",
        "sound": "Assets/sound/science/10/lungs.m4a"
      },
      "Diaphragm": {
        "img": "Assets/topic/SCIENCE/Level 10/diaphragm_.jpg",
        "sound": "Assets/sound/science/10/diaphragm.m4a"
      },
      "Ribs": {
        "img": "Assets/topic/SCIENCE/Level 10/ribs.jpg",
        "sound": "Assets/sound/science/10/ribs.m4a"
      }
    }
  }
};

  // Expose global manifest
  window.MMAssetManifest = ASSET_MANIFEST;
  window.MMAudioCache = window.MMAudioCache || {};

  /* ============================================================
     HELPERS: GET PRELOADED URLS
     ============================================================ */
  function getCardAsset(subject, level, cardName) {
    const s = ASSET_MANIFEST[subject];
    const l = s && s[String(level)];
    if (!l) return { img: null, sound: null };
    let item = l[cardName];
    if (!item && cardName === 'pro') item = l['proj'];
    if (!item && cardName === 'proj') item = l['pro'];
    if (!item) {
      // Case-insensitive lookup
      for (const k in l) {
        if (k.toLowerCase() === (cardName || '').toLowerCase()) {
          item = l[k];
          break;
        }
      }
    }
    if (!item) return { img: null, sound: null };
    return {
      img: item.img ? (base + item.img) : null,
      sound: item.sound ? (base + item.sound) : null
    };
  }

  function getCardImage(subject, level, cardName) {
    const a = getCardAsset(subject, level, cardName);
    return a.img;
  }

  function getCardAudioUrl(subject, level, cardName) {
    const a = getCardAsset(subject, level, cardName);
    return a.sound;
  }

  /* ============================================================
     PRELOAD IMAGE HELPER
     ============================================================ */
  function preloadImage(url) {
    return new Promise(function (resolve) {
      if (!url) return resolve(null);
      const img = new Image();
      img.decoding = 'async';
      img.onload = function () { resolve(url); };
      img.onerror = function () { resolve(null); };
      img.src = url;
    });
  }

  /* ============================================================
     PRELOAD AUDIO HELPER (Caches HTMLAudioElement & warms cache)
     ============================================================ */
  function preloadAudio(url, cacheKey) {
    return new Promise(function (resolve) {
      if (!url) return resolve(null);
      if (window.MMAudioCache[cacheKey]) {
        return resolve(window.MMAudioCache[cacheKey]);
      }
      const audio = new Audio();
      audio.preload = 'auto';
      let resolved = false;

      function onReady() {
        if (resolved) return;
        resolved = true;
        window.MMAudioCache[cacheKey] = audio;
        resolve(audio);
      }

      // Resolve once enough data is loaded to play
      audio.addEventListener('canplaythrough', onReady, { once: true });
      audio.addEventListener('loadeddata', onReady, { once: true });
      audio.addEventListener('error', function () {
        if (resolved) return;
        resolved = true;
        resolve(null);
      }, { once: true });

      // Safety timeout in case of network throttle
      setTimeout(function () {
        if (!resolved) {
          resolved = true;
          window.MMAudioCache[cacheKey] = audio;
          resolve(audio);
        }
      }, 1500);

      audio.src = url;
      audio.load();
    });
  }

  /* ============================================================
     PLAY CARD AUDIO INSTANTLY (From Cache or Web Audio Fallback)
     ============================================================ */
  function playCardAudio(subject, level, cardName) {
    return new Promise(function (resolve) {
      const soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
      if (!soundEnabled) return resolve(null);

      const cacheKey = subject + ':' + level + ':' + cardName;
      let audio = window.MMAudioCache[cacheKey];

      if (!audio) {
        const url = getCardAudioUrl(subject, level, cardName);
        if (url) {
          audio = new Audio(url);
          audio.preload = 'auto';
          window.MMAudioCache[cacheKey] = audio;
        }
      }

      if (audio) {
        // Reset playback position
        try { audio.currentTime = 0; } catch (e) {}

        const playPromise = audio.play();
        let ended = false;
        function finish() {
          if (ended) return;
          ended = true;
          resolve(audio);
        }

        if (playPromise && typeof playPromise.then === 'function') {
          playPromise.then(function () {
            audio.addEventListener('ended', finish, { once: true });
            // Max safety timeout so dialogue never hangs
            setTimeout(finish, 4500);
          }).catch(function (err) {
            console.log('[AssetLoader] Audio play fallback:', err && err.message);
            // Speech synthesis or chime fallback
            speakFallback(cardName);
            finish();
          });
        } else {
          audio.addEventListener('ended', finish, { once: true });
          setTimeout(finish, 3500);
        }
      } else {
        // No audio file on disk (e.g. mouse or microphone in level 10)
        speakFallback(cardName);
        setTimeout(function () { resolve(null); }, 600);
      }
    });
  }

  function speakFallback(text) {
    if (!text) return;
    try {
      if (window.MMSfx && window.MMSfx.play) {
        window.MMSfx.tone(523, 0.15, 'sine', 0.8);
      }
      if ('speechSynthesis' in window && !window.speechSynthesis.speaking) {
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 1.0;
        u.volume = 0.9;
        window.speechSynthesis.speak(u);
      }
    } catch (e) {}
  }

  /* ============================================================
     BUILD QUEUE FOR CURRENT PAGE
     ============================================================ */
  function getPreloadTasks() {
    const tasks = [];

    if (isSubject) {
      SUBJECT_IMAGES.forEach(src => tasks.push({ type: 'img', src }));
    }

    if (isLevel) {
      // 1. Level map images
      LEVEL_IMAGES.forEach(src => tasks.push({ type: 'img', src }));

      // 2. Preload voice audio and card images for this subject's levels
      const params = new URLSearchParams(window.location.search);
      const subject = params.get('subject') || 'computer';
      const subManifest = ASSET_MANIFEST[subject];
      if (subManifest) {
        for (let lvl = 1; lvl <= 10; lvl++) {
          const lvlCards = subManifest[String(lvl)];
          if (lvlCards) {
            for (const cName in lvlCards) {
              const item = lvlCards[cName];
              if (item.img) tasks.push({ type: 'img', src: base + item.img });
              if (item.sound) tasks.push({ type: 'sound', src: base + item.sound, key: subject + ':' + lvl + ':' + cName });
            }
          }
        }
      }
    }

    if (isGameplay) {
      const params = new URLSearchParams(window.location.search);
      let subject = params.get('subject');
      if (!subject) {
        if (/gameplay-computer/i.test(path)) subject = 'computer';
        else if (/gameplay-science/i.test(path)) subject = 'science';
        else if (/gameplay-ap/i.test(path)) subject = 'ap';
        else subject = 'computer';
      }
      const level = parseInt(params.get('level'), 10) || 1;

      const subManifest = ASSET_MANIFEST[subject];
      const lvlCards = subManifest && subManifest[String(level)];
      if (lvlCards) {
        for (const cName in lvlCards) {
          const item = lvlCards[cName];
          if (item.img) tasks.push({ type: 'img', src: base + item.img });
          if (item.sound) tasks.push({ type: 'sound', src: base + item.sound, key: subject + ':' + level + ':' + cName });
        }
      }
    }

    return tasks;
  }

  /* ============================================================
     EXECUTE PRELOAD SILENTLY
     ============================================================ */
  const tasks = getPreloadTasks();
  const total = tasks.length;
  const state = { progress: 0, loaded: 0, total: total, ready: false };

  const readyPromise = (async function () {
    if (total === 0) {
      state.progress = 100;
      state.ready = true;
      window.dispatchEvent(new Event('assetsLoaded'));
      return;
    }

    const CONCURRENCY = 6;
    let index = 0;

    async function worker() {
      while (index < tasks.length) {
        const task = tasks[index++];
        if (task.type === 'img') {
          await preloadImage(task.src);
        } else if (task.type === 'sound') {
          await preloadAudio(task.src, task.key);
        }
        state.loaded++;
        state.progress = Math.round((state.loaded / total) * 100);
      }
    }

    const workers = [];
    for (let i = 0; i < Math.min(CONCURRENCY, total); i++) {
      workers.push(worker());
    }

    await Promise.all(workers);
    state.progress = 100;
    state.ready = true;
    window.dispatchEvent(new Event('assetsLoaded'));
  })();

  /* ============================================================
     PUBLIC API EXPORT
     ============================================================ */
  window.assetLoader = {
    ready: readyPromise,
    progress: function () { return state.progress; },
    isReady: function () { return state.ready; },
    state: state,
    getCardAsset: getCardAsset,
    getCardImage: getCardImage,
    getCardAudioUrl: getCardAudioUrl,
    playCardAudio: playCardAudio,
    preloadImage: preloadImage,
    preloadAudio: preloadAudio
  };

  console.log('[AssetLoader] Ready. Exact catalog loaded for all subjects/levels.');
})();
