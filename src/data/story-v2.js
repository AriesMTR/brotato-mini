// V2 runtime dialogue. Source: output/design/revision-v2/story-v2.json.
// This data is independent from presentation and is available offline without fetch.
const SpireStoryV2 = {
  "version": "2.1.0",
  "title": "烬塔残响：第999次救赎 · 剧情对白与演出 V2.1",
  "opening": {
    "stageId": "opening.awakening",
    "eventId": "event.opening.awakening",
    "title": "序章 · 在石棺里醒来",
    "dialogue": [
      {
        "speaker": "零",
        "text": "……有人吗？",
        "lineId": "opening.awakening.line.01"
      },
      {
        "speaker": "零",
        "text": "我叫……怎么会连这个也想不起来。",
        "lineId": "opening.awakening.line.02"
      },
      {
        "speaker": "零",
        "text": "九百九十八……牌子上只有这个。这不是名字。",
        "lineId": "opening.awakening.line.03"
      },
      {
        "speaker": "神秘女声",
        "text": "醒了？把灯拿好。",
        "lineId": "opening.awakening.line.04"
      },
      {
        "speaker": "零",
        "text": "你在哪儿？我看不见你。",
        "lineId": "opening.awakening.line.05"
      },
      {
        "speaker": "神秘女声",
        "text": "看见桥后的塔了吗？到塔顶来，我会告诉你名字。",
        "lineId": "opening.awakening.line.06"
      },
      {
        "speaker": "神秘女声",
        "text": "到那时，天就会亮了。",
        "lineId": "opening.awakening.line.07"
      },
      {
        "speaker": "零",
        "text": "先过桥。总得有人知道，我是怎么到这儿的。",
        "lineId": "opening.awakening.line.08"
      }
    ],
    "shots": [
      {
        "seconds": 8,
        "line": {
          "speaker": "零",
          "text": "……有人吗？"
        },
        "shotId": "opening.awakening.shot.01"
      },
      {
        "seconds": 7,
        "line": {
          "speaker": "零",
          "text": "我叫……怎么会连这个也想不起来。"
        },
        "shotId": "opening.awakening.shot.02"
      },
      {
        "seconds": 8,
        "line": {
          "speaker": "零",
          "text": "九百九十八……牌子上只有这个。这不是名字。"
        },
        "shotId": "opening.awakening.shot.03"
      },
      {
        "seconds": 8,
        "line": {
          "speaker": "神秘女声",
          "text": "醒了？把灯拿好。"
        },
        "shotId": "opening.awakening.shot.04"
      },
      {
        "seconds": 9,
        "line": {
          "speaker": "神秘女声",
          "text": "看见桥后的塔了吗？到塔顶来，我会告诉你名字。"
        },
        "shotId": "opening.awakening.shot.05"
      },
      {
        "seconds": 8,
        "line": {
          "speaker": "零",
          "text": "先过桥。总得有人知道，我是怎么到这儿的。"
        },
        "shotId": "opening.awakening.shot.06"
      }
    ]
  },
  "floors": [
    {
      "floor": 1,
      "title": "不敢看我的人",
      "act": "第一幕 · 雨夜长桥",
      "location": "长桥入口",
      "objective": "穿过雨夜长桥，找到女声指向的塔门；先弄清红衣拦路人是否认识自己。",
      "before": [
        {
          "speaker": "烬羽",
          "text": "别再往前。把灯放下。",
          "lineId": "floor.01.before.line.01"
        },
        {
          "speaker": "零",
          "text": "你刚才想叫我什么？",
          "lineId": "floor.01.before.line.02"
        },
        {
          "speaker": "烬羽",
          "text": "……先回桥那边去。",
          "lineId": "floor.01.before.line.03"
        },
        {
          "speaker": "零",
          "text": "那你看着我说。你是不是认识我？",
          "lineId": "floor.01.before.line.04"
        }
      ],
      "after": [
        {
          "speaker": "零",
          "text": "那一刀……你临时偏开了。",
          "lineId": "floor.01.after.line.01"
        },
        {
          "speaker": "烬羽",
          "text": "别追过来。你脚边的石头是松的。",
          "lineId": "floor.01.after.line.02"
        }
      ],
      "stageId": "floor.01",
      "eventId": "event.floor.01.enter"
    },
    {
      "floor": 2,
      "title": "垂下的长矛",
      "act": "第一幕 · 雨夜长桥",
      "location": "旧卫桥廊",
      "objective": "穿过旧卫封锁，观察它们为何在零面前迟疑。",
      "before": [
        {
          "speaker": "零",
          "text": "他的矛尖刚才已经抵到我了。",
          "lineId": "floor.02.before.line.01"
        },
        {
          "speaker": "烬羽",
          "text": "退到我身后。别伸手碰他。",
          "lineId": "floor.02.before.line.02"
        },
        {
          "speaker": "零",
          "text": "可他看见我的脸，就把矛放下了。",
          "lineId": "floor.02.before.line.03"
        },
        {
          "speaker": "烬羽",
          "text": "……这一下，倒还认得。",
          "lineId": "floor.02.before.line.04"
        }
      ],
      "after": [
        {
          "speaker": "零",
          "text": "他站回我身后了。好像是在……护着我。",
          "lineId": "floor.02.after.line.01"
        },
        {
          "speaker": "烬羽",
          "text": "那儿原来就是他站的地方。",
          "lineId": "floor.02.after.line.02"
        }
      ],
      "stageId": "floor.02",
      "eventId": "event.floor.02.enter"
    },
    {
      "floor": 3,
      "title": "没有喝完的茶",
      "act": "第一幕 · 雨夜长桥",
      "location": "石碑旁的风亭",
      "objective": "再次与青羽会面，辨认998铭牌，获得去往守桥封门的补给与线索。",
      "before": [
        {
          "speaker": "青羽",
          "text": "又淋湿了。来，牌子借我看一眼。",
          "lineId": "floor.03.before.line.01"
        },
        {
          "speaker": "零",
          "text": "棺里只找到这个。998……是给我的吗？",
          "lineId": "floor.03.before.line.02"
        },
        {
          "speaker": "青羽",
          "text": "是旧编号。磨掉的地方已经看不清了。",
          "lineId": "floor.03.before.line.03"
        },
        {
          "speaker": "零",
          "text": "你刚才看到数字，怎么不说话了？",
          "lineId": "floor.03.before.line.04"
        },
        {
          "speaker": "青羽",
          "text": "想起点旧事。先收好，以后拿它和别的东西对一对。",
          "lineId": "floor.03.before.line.05"
        }
      ],
      "after": [
        {
          "speaker": "零",
          "text": "你怎么知道我想喝甜的？",
          "lineId": "floor.03.after.line.01"
        },
        {
          "speaker": "青羽",
          "text": "先喝一口。别烫着。",
          "lineId": "floor.03.after.line.02"
        },
        {
          "speaker": "零",
          "text": "你之后还在这里吗？",
          "lineId": "floor.03.after.line.03"
        },
        {
          "speaker": "青羽",
          "text": "风亭亮着灯，你就来。我给你留一杯。",
          "lineId": "floor.03.after.line.04"
        }
      ],
      "stageId": "floor.03",
      "eventId": "event.floor.03.enter"
    },
    {
      "floor": 4,
      "title": "狐面落地",
      "act": "第一幕 · 雨夜长桥",
      "location": "守桥封门",
      "objective": "击败烬羽，获得剑穗并完成第一次记忆互动。",
      "before": [
        {
          "speaker": "烬羽",
          "text": "再走一步，我就拔刀。",
          "lineId": "floor.04.before.line.01"
        },
        {
          "speaker": "零",
          "text": "你宁肯拿刀拦我，也不肯告诉我为什么？",
          "lineId": "floor.04.before.line.02"
        },
        {
          "speaker": "烬羽",
          "text": "……站远点。接下来，我不会收刀了。",
          "lineId": "floor.04.before.line.03"
        }
      ],
      "after": [
        {
          "speaker": "烬羽",
          "text": "……别扶我。先把灯放远一点。",
          "lineId": "floor.04.after.line.01"
        },
        {
          "speaker": "零",
          "text": "这条剑穗……结怎么这么熟？",
          "lineId": "floor.04.after.line.02"
        },
        {
          "speaker": "烬羽",
          "text": "你系的。一直舍不得拆……拿着吧。",
          "lineId": "floor.04.after.line.03"
        },
        {
          "speaker": "零",
          "text": "好，不拆。我就照这个样子收着。",
          "lineId": "floor.04.after.line.04"
        }
      ],
      "stageId": "floor.04",
      "eventId": "event.floor.04.enter"
    },
    {
      "floor": 5,
      "title": "不会醒来的城",
      "act": "第二幕 · 永冻冰窟",
      "location": "冰封城门",
      "objective": "进入冰封街道，寻找前往圣堂的通路。",
      "before": [
        {
          "speaker": "零",
          "text": "冰里的孩子……眼睫还在动。",
          "lineId": "floor.05.before.line.01"
        },
        {
          "speaker": "艾丝特莉亚",
          "text": "灯放低。别照他的脸。",
          "lineId": "floor.05.before.line.02"
        },
        {
          "speaker": "零",
          "text": "这些人……都是你冻住的？",
          "lineId": "floor.05.before.line.03"
        },
        {
          "speaker": "艾丝特莉亚",
          "text": "是。你要问我，就站到这边来。",
          "lineId": "floor.05.before.line.04"
        }
      ],
      "after": [
        {
          "speaker": "零",
          "text": "他呼了一口气。冰上有雾。",
          "lineId": "floor.05.after.line.01"
        },
        {
          "speaker": "艾丝特莉亚",
          "text": "我看见了。他还在。把灯遮上吧。",
          "lineId": "floor.05.after.line.02"
        }
      ],
      "stageId": "floor.05",
      "eventId": "event.floor.05.enter"
    },
    {
      "floor": 6,
      "title": "灯伸向了谁",
      "act": "第二幕 · 永冻冰窟",
      "location": "封魂冰廊",
      "objective": "通过冰廊，亲眼看见提灯对冰中生命的异常反应。",
      "before": [
        {
          "speaker": "零",
          "text": "我没碰灯，它怎么自己亮起来了？",
          "lineId": "floor.06.before.line.01"
        },
        {
          "speaker": "艾丝特莉亚",
          "text": "退后！那道光已经碰到他了。",
          "lineId": "floor.06.before.line.02"
        },
        {
          "speaker": "零",
          "text": "我把灯移开了……为什么还跟着？",
          "lineId": "floor.06.before.line.03"
        },
        {
          "speaker": "艾丝特莉亚",
          "text": "先合上灯罩。手别松。",
          "lineId": "floor.06.before.line.04"
        }
      ],
      "after": [
        {
          "speaker": "零",
          "text": "从他身上出来的光……和蓝晶一样。",
          "lineId": "floor.06.after.line.01"
        },
        {
          "speaker": "艾丝特莉亚",
          "text": "你看清了。以后听见她催你，先看看灯在吸什么。",
          "lineId": "floor.06.after.line.02"
        },
        {
          "speaker": "神秘女声",
          "text": "她把这些人关在冰里，却要你怕一盏灯。",
          "lineId": "floor.06.after.line.03"
        }
      ],
      "stageId": "floor.06",
      "eventId": "event.floor.06.enter"
    },
    {
      "floor": 7,
      "title": "没听完的曲子",
      "act": "第二幕 · 永冻冰窟",
      "location": "旧圣堂外庭",
      "objective": "追随熟悉旋律抵达圣堂，确认零与星使共享过一段过去。",
      "before": [
        {
          "speaker": "零",
          "text": "后面还有两声……我怎么会哼这个？",
          "lineId": "floor.07.before.line.01"
        },
        {
          "speaker": "艾丝特莉亚",
          "text": "别唱。……让我先把盒子合上。",
          "lineId": "floor.07.before.line.02"
        },
        {
          "speaker": "零",
          "text": "是我唱错了吗？",
          "lineId": "floor.07.before.line.03"
        },
        {
          "speaker": "艾丝特莉亚",
          "text": "没有。你以前总嫌最后一段太长。",
          "lineId": "floor.07.before.line.04"
        }
      ],
      "after": [
        {
          "speaker": "零",
          "text": "这次我想听完。可以吗？",
          "lineId": "floor.07.after.line.01"
        },
        {
          "speaker": "艾丝特莉亚",
          "text": "先看看怀表里的画像。看完……你再说。",
          "lineId": "floor.07.after.line.02"
        }
      ],
      "stageId": "floor.07",
      "eventId": "event.floor.07.enter"
    },
    {
      "floor": 8,
      "title": "冰里还有呼吸",
      "act": "第二幕 · 永冻冰窟",
      "location": "永冻圣堂",
      "objective": "击败星使，获得银怀表；通过合影与记忆确认冰封是保护。",
      "before": [
        {
          "speaker": "艾丝特莉亚",
          "text": "圣堂后面就是上行的路。我不会让这盏灯过去。",
          "lineId": "floor.08.before.line.01"
        },
        {
          "speaker": "零",
          "text": "我会把它盖好。你让我看那张画像，好不好？",
          "lineId": "floor.08.before.line.02"
        },
        {
          "speaker": "艾丝特莉亚",
          "text": "你上次也是这样握着它，说自己还能控制。",
          "lineId": "floor.08.before.line.03"
        }
      ],
      "after": [
        {
          "speaker": "艾丝特莉亚",
          "text": "表扣松了。用拇指抵住这里。",
          "lineId": "floor.08.after.line.01"
        },
        {
          "speaker": "零",
          "text": "白衣的是我……你和烬羽，也在。",
          "lineId": "floor.08.after.line.02"
        },
        {
          "speaker": "艾丝特莉亚",
          "text": "你抓着我的袖子，叫我先救他们。那只手抖得很厉害。",
          "lineId": "floor.08.after.line.03"
        },
        {
          "speaker": "零",
          "text": "我还以为，是你把他们困在这里……对不起。",
          "lineId": "floor.08.after.line.04"
        }
      ],
      "stageId": "floor.08",
      "eventId": "event.floor.08.enter"
    },
    {
      "floor": 9,
      "title": "倒着走的钟",
      "act": "第三幕 · 倒悬钟楼",
      "location": "钟楼下层梯井",
      "objective": "穿过倒悬梯井，找到机关控制者。",
      "before": [
        {
          "speaker": "零",
          "text": "雨往上走……那截阶梯也在动！",
          "lineId": "floor.09.before.line.01"
        },
        {
          "speaker": "伽蓝",
          "text": "左脚收回来。第三块是空的。",
          "lineId": "floor.09.before.line.02"
        },
        {
          "speaker": "零",
          "text": "是你接住的？可上面的门……",
          "lineId": "floor.09.before.line.03"
        },
        {
          "speaker": "伽蓝",
          "text": "我关的。等你站稳了再吵。",
          "lineId": "floor.09.before.line.04"
        }
      ],
      "after": [
        {
          "speaker": "零",
          "text": "门不让我过，掉下去又接着。你到底想怎样？",
          "lineId": "floor.09.after.line.01"
        },
        {
          "speaker": "伽蓝",
          "text": "想让你活着。别再试那块阶梯。",
          "lineId": "floor.09.after.line.02"
        }
      ],
      "stageId": "floor.09",
      "eventId": "event.floor.09.enter"
    },
    {
      "floor": 10,
      "title": "拉住我的那只手",
      "act": "第三幕 · 倒悬钟楼",
      "location": "钟楼断阶与维修台",
      "objective": "穿过断阶，发现伽蓝宁愿损伤自身也会救下零，却坚持关闭上行道路。",
      "before": [
        {
          "speaker": "伽蓝",
          "text": "抓住我！别松手。",
          "lineId": "floor.10.before.line.01"
        },
        {
          "speaker": "零",
          "text": "松开吧，你的手要断了！",
          "lineId": "floor.10.before.line.02"
        },
        {
          "speaker": "伽蓝",
          "text": "别替我算这个。另一只手也给我。",
          "lineId": "floor.10.before.line.03"
        },
        {
          "speaker": "零",
          "text": "……我抓好了。你慢一点。",
          "lineId": "floor.10.before.line.04"
        }
      ],
      "after": [
        {
          "speaker": "伽蓝",
          "text": "断了几根线。手还能动。",
          "lineId": "floor.10.after.line.01"
        },
        {
          "speaker": "零",
          "text": "工具给我。你先别再拧发条。",
          "lineId": "floor.10.after.line.02"
        },
        {
          "speaker": "伽蓝",
          "text": "最里面那格。……小的那把。",
          "lineId": "floor.10.after.line.03"
        }
      ],
      "stageId": "floor.10",
      "eventId": "event.floor.10.enter"
    },
    {
      "floor": 11,
      "title": "手还记得",
      "act": "第三幕 · 倒悬钟楼",
      "location": "钟楼维修与记录台",
      "objective": "帮助伽蓝调整发条，并追问究竟是谁要求阻止登塔。",
      "before": [
        {
          "speaker": "伽蓝",
          "text": "到这里就停，再拧半圈会——",
          "lineId": "floor.11.before.line.01"
        },
        {
          "speaker": "零",
          "text": "疼。我知道……为什么我会知道？",
          "lineId": "floor.11.before.line.02"
        },
        {
          "speaker": "伽蓝",
          "text": "你想起来了？",
          "lineId": "floor.11.before.line.03"
        },
        {
          "speaker": "零",
          "text": "没有。可刚拿起工具，就知道该怎么做。",
          "lineId": "floor.11.before.line.04"
        }
      ],
      "after": [
        {
          "speaker": "零",
          "text": "手修好了。现在能告诉我，谁叫你关门的吗？",
          "lineId": "floor.11.after.line.01"
        },
        {
          "speaker": "伽蓝",
          "text": "我答应过，不对提灯的人放行。",
          "lineId": "floor.11.after.line.02"
        },
        {
          "speaker": "零",
          "text": "可你救了我。那个人也不想让我死，是不是？",
          "lineId": "floor.11.after.line.03"
        },
        {
          "speaker": "伽蓝",
          "text": "……那个人，怕自己活着走到塔顶。",
          "lineId": "floor.11.after.line.04"
        }
      ],
      "stageId": "floor.11",
      "eventId": "event.floor.11.enter"
    },
    {
      "floor": 12,
      "title": "最后一道指令",
      "act": "第三幕 · 倒悬钟楼",
      "location": "星晷断罪台",
      "objective": "击败伽蓝，获得黄金发条，恢复“阻止我”的完整记忆。",
      "before": [
        {
          "speaker": "伽蓝",
          "text": "门后的机关，我已经全部锁死。",
          "lineId": "floor.12.before.line.01"
        },
        {
          "speaker": "零",
          "text": "把那道指令放给我听。我想知道，你到底在替谁守门。",
          "lineId": "floor.12.before.line.02"
        },
        {
          "speaker": "伽蓝",
          "text": "先放下灯。否则，我不能开门。",
          "lineId": "floor.12.before.line.03"
        }
      ],
      "after": [
        {
          "speaker": "伽蓝",
          "text": "靠近些。声音快断了……别漏掉。",
          "lineId": "floor.12.after.line.01"
        },
        {
          "speaker": "记忆中的零",
          "text": "如果我又提着灯回来，阻止我。哪怕我求你，也别开门。",
          "lineId": "floor.12.after.line.02"
        },
        {
          "speaker": "伽蓝",
          "text": "塔是关住你的。你把这盏灯带上去，就能从里面打开它。",
          "lineId": "floor.12.after.line.03"
        },
        {
          "speaker": "零",
          "text": "原来是我……把你们都留在这里。",
          "lineId": "floor.12.after.line.04"
        }
      ],
      "stageId": "floor.12",
      "eventId": "event.floor.12.enter"
    },
    {
      "floor": 13,
      "title": "同样的脚印",
      "act": "第四幕 · 日蚀镜界",
      "location": "黑水回廊",
      "objective": "跨过镜界入口，确认前人留下的痕迹与自己有关。",
      "before": [
        {
          "speaker": "零",
          "text": "袖口的破洞……连位置都和我的一样。",
          "lineId": "floor.13.before.line.01"
        },
        {
          "speaker": "神秘女声",
          "text": "她们只差几步。你已经走得比她们远了。",
          "lineId": "floor.13.before.line.02"
        },
        {
          "speaker": "零",
          "text": "你也叫她们来找你，说会记起名字？",
          "lineId": "floor.13.before.line.03"
        },
        {
          "speaker": "神秘女声",
          "text": "别看了。前面就是我，你已经等得太久。",
          "lineId": "floor.13.before.line.04"
        }
      ],
      "after": [
        {
          "speaker": "零",
          "text": "牌子、白衣、这条路……我已经走过多少次？",
          "lineId": "floor.13.after.line.01"
        },
        {
          "speaker": "神秘女声",
          "text": "数那些做什么？这一次，你会走完。",
          "lineId": "floor.13.after.line.02"
        }
      ],
      "stageId": "floor.13",
      "eventId": "event.floor.13.enter"
    },
    {
      "floor": 14,
      "title": "灯里的声音",
      "act": "第四幕 · 日蚀镜界",
      "location": "无面镜廊",
      "objective": "顶住女声催促，通过镜廊并检查三件信物如何干扰提灯。",
      "before": [
        {
          "speaker": "神秘女声",
          "text": "剑穗都浸透了。怀表也不走了，还带着做什么？",
          "lineId": "floor.14.before.line.01"
        },
        {
          "speaker": "零",
          "text": "表盖里有我们。剑穗是烬羽亲手交给我的。",
          "lineId": "floor.14.before.line.02"
        },
        {
          "speaker": "神秘女声",
          "text": "她们拿旧东西留住你，却从来不让你见我。",
          "lineId": "floor.14.before.line.03"
        },
        {
          "speaker": "零",
          "text": "我一摸到它们，你的声音就远了。你怕的是这个？",
          "lineId": "floor.14.before.line.04"
        }
      ],
      "after": [
        {
          "speaker": "零",
          "text": "刚才我攥住发条，灯就安静了。",
          "lineId": "floor.14.after.line.01"
        },
        {
          "speaker": "零",
          "text": "我还要往上走。有些话，我要看着你的脸问。",
          "lineId": "floor.14.after.line.02"
        }
      ],
      "stageId": "floor.14",
      "eventId": "event.floor.14.enter"
    },
    {
      "floor": 15,
      "title": "这次由你决定",
      "act": "第四幕 · 日蚀镜界",
      "location": "终门前的风亭",
      "objective": "获得青羽风翎，补全四段记忆，为进入终门后的自主判断做好准备。",
      "before": [
        {
          "speaker": "零",
          "text": "你总把杯子放在我惯用的那只手边。",
          "lineId": "floor.15.before.line.01"
        },
        {
          "speaker": "青羽",
          "text": "以前一起喝茶喝惯了。想改，也没改过来。",
          "lineId": "floor.15.before.line.02"
        },
        {
          "speaker": "零",
          "text": "可我每次回来，都把你忘了。",
          "lineId": "floor.15.before.line.03"
        },
        {
          "speaker": "青羽",
          "text": "嗯。那就再认识一次。我叫青羽。",
          "lineId": "floor.15.before.line.04"
        },
        {
          "speaker": "青羽",
          "text": "这根风翎也带上。最后几步，别忙着答应谁。",
          "lineId": "floor.15.before.line.05"
        }
      ],
      "after": [
        {
          "speaker": "零",
          "text": "那些话，你以前说了多少次？",
          "lineId": "floor.15.after.line.01"
        },
        {
          "speaker": "青羽",
          "text": "数不清了。这回你肯坐下听，我就多坐一会儿。",
          "lineId": "floor.15.after.line.02"
        },
        {
          "speaker": "零",
          "text": "再等我一下。我想把四样东西都看完。",
          "lineId": "floor.15.after.line.03"
        }
      ],
      "stageId": "floor.15",
      "eventId": "event.floor.15.enter"
    },
    {
      "floor": 16,
      "title": "把灯拿好",
      "act": "第四幕 · 日蚀镜界",
      "location": "零号圣所 · 黑曜石巨镜",
      "objective": "直面镜中圣女与自身身份；决定回应她的呼唤，还是回想同伴的约定并拒绝交灯。",
      "before": [
        {
          "speaker": "日蚀圣女",
          "text": "醒了？把灯拿好。",
          "lineId": "floor.16.before.line.01"
        },
        {
          "speaker": "零",
          "text": "是你……连声音都和棺边那时一样。",
          "lineId": "floor.16.before.line.02"
        },
        {
          "speaker": "日蚀圣女",
          "text": "你把我忘在这里了。把灯给我，我们就能重新成为一个人。",
          "lineId": "floor.16.before.line.03"
        },
        {
          "speaker": "零",
          "text": "先别碰灯。你让我看看你的脸。",
          "lineId": "floor.16.before.line.04"
        }
      ],
      "after": [
        {
          "speaker": "日蚀圣女",
          "text": "你连自己是谁都忘了……怎么还留得住她们。",
          "lineId": "floor.16.after.line.01"
        },
        {
          "speaker": "零",
          "text": "剑穗、怀表、发条、风翎。我都带来了。",
          "lineId": "floor.16.after.line.02"
        },
        {
          "speaker": "零",
          "text": "这次，我没把她们留在身后。",
          "lineId": "floor.16.after.line.03"
        }
      ],
      "stageId": "floor.16",
      "eventId": "event.floor.16.enter"
    }
  ],
  "boss_stages": {
    "jinyu": {
      "character": "烬羽",
      "floor": 4,
      "first_meeting_floor": 1,
      "first_meeting": {
        "stageId": "boss.jinyu.first_meeting",
        "eventId": "event.boss.jinyu.first_meeting",
        "title": "初见 · 雨里的人",
        "dialogue": [
          {
            "speaker": "烬羽",
            "text": "别再往前。把灯放下。",
            "lineId": "boss.jinyu.first_meeting.line.01"
          },
          {
            "speaker": "零",
            "text": "你刚才想叫我什么？",
            "lineId": "boss.jinyu.first_meeting.line.02"
          },
          {
            "speaker": "烬羽",
            "text": "……先回桥那边去。",
            "lineId": "boss.jinyu.first_meeting.line.03"
          },
          {
            "speaker": "零",
            "text": "那你看着我说。你是不是认识我？",
            "lineId": "boss.jinyu.first_meeting.line.04"
          }
        ],
        "shots": [
          {
            "seconds": 5,
            "line": {
              "speaker": "烬羽",
              "text": "别再往前。把灯放下。"
            },
            "shotId": "boss.jinyu.first_meeting.shot.01"
          },
          {
            "seconds": 5,
            "line": {
              "speaker": "零",
              "text": "你刚才想叫我什么？"
            },
            "shotId": "boss.jinyu.first_meeting.shot.02"
          },
          {
            "seconds": 5,
            "line": {
              "speaker": "烬羽",
              "text": "……先回桥那边去。"
            },
            "shotId": "boss.jinyu.first_meeting.shot.03"
          }
        ]
      },
      "pre_battle": {
        "stageId": "boss.jinyu.pre_battle",
        "eventId": "event.boss.jinyu.pre_battle",
        "title": "开战 · 这一步不能让",
        "dialogue": [
          {
            "speaker": "烬羽",
            "text": "再走一步，我就拔刀。",
            "lineId": "boss.jinyu.pre_battle.line.01"
          },
          {
            "speaker": "零",
            "text": "你宁肯拿刀拦我，也不肯告诉我为什么？",
            "lineId": "boss.jinyu.pre_battle.line.02"
          },
          {
            "speaker": "烬羽",
            "text": "……站远点。接下来，我不会收刀了。",
            "lineId": "boss.jinyu.pre_battle.line.03"
          }
        ],
        "shots": [
          {
            "seconds": 4,
            "line": {
              "speaker": "烬羽",
              "text": "再走一步，我就拔刀。"
            },
            "shotId": "boss.jinyu.pre_battle.shot.01"
          },
          {
            "seconds": 5,
            "line": {
              "speaker": "零",
              "text": "你宁肯拿刀拦我，也不肯告诉我为什么？"
            },
            "shotId": "boss.jinyu.pre_battle.shot.02"
          },
          {
            "seconds": 4,
            "line": {
              "speaker": "烬羽",
              "text": "……站远点。接下来，我不会收刀了。"
            },
            "shotId": "boss.jinyu.pre_battle.shot.03"
          }
        ]
      },
      "phase2": {
        "stageId": "boss.jinyu.phase2",
        "eventId": "event.boss.jinyu.phase2",
        "title": "二阶段 · 刀还没有放下",
        "dialogue": [
          {
            "speaker": "零",
            "text": "别撑了。你的手都握不住刀了！",
            "lineId": "boss.jinyu.phase2.line.01"
          },
          {
            "speaker": "烬羽",
            "text": "还握得住。",
            "lineId": "boss.jinyu.phase2.line.02"
          },
          {
            "speaker": "烬羽",
            "text": "我放你过去……谁把你带回来？",
            "lineId": "boss.jinyu.phase2.line.03"
          }
        ],
        "shots": [
          {
            "seconds": 4,
            "line": {
              "speaker": "零",
              "text": "别撑了。你的手都握不住刀了！"
            },
            "shotId": "boss.jinyu.phase2.shot.01"
          },
          {
            "seconds": 5,
            "line": {
              "speaker": "烬羽",
              "text": "还握得住。"
            },
            "shotId": "boss.jinyu.phase2.shot.02"
          },
          {
            "seconds": 5,
            "line": {
              "speaker": "烬羽",
              "text": "我放你过去……谁把你带回来？"
            },
            "shotId": "boss.jinyu.phase2.shot.03"
          }
        ]
      },
      "boss_defeated": {
        "stageId": "boss.jinyu.boss_defeated",
        "eventId": "event.boss.jinyu.boss_defeated",
        "title": "最终败北 · 面具之后",
        "dialogue": [
          {
            "speaker": "烬羽",
            "text": "……别扶我。先把灯放远一点。",
            "lineId": "boss.jinyu.boss_defeated.line.01"
          },
          {
            "speaker": "零",
            "text": "这条剑穗……结怎么这么熟？",
            "lineId": "boss.jinyu.boss_defeated.line.02"
          },
          {
            "speaker": "烬羽",
            "text": "你系的。一直舍不得拆……拿着吧。",
            "lineId": "boss.jinyu.boss_defeated.line.03"
          },
          {
            "speaker": "零",
            "text": "好，不拆。我就照这个样子收着。",
            "lineId": "boss.jinyu.boss_defeated.line.04"
          }
        ],
        "shots": [
          {
            "seconds": 5,
            "line": {
              "speaker": "烬羽",
              "text": "……别扶我。先把灯放远一点。"
            },
            "shotId": "boss.jinyu.boss_defeated.shot.01"
          },
          {
            "seconds": 5,
            "line": {
              "speaker": "零",
              "text": "这条剑穗……结怎么这么熟？"
            },
            "shotId": "boss.jinyu.boss_defeated.shot.02"
          },
          {
            "seconds": 6,
            "line": {
              "speaker": "烬羽",
              "text": "你系的。一直舍不得拆……拿着吧。"
            },
            "shotId": "boss.jinyu.boss_defeated.shot.03"
          }
        ]
      }
    },
    "astria": {
      "character": "艾丝特莉亚",
      "floor": 8,
      "first_meeting_floor": 5,
      "first_meeting": {
        "stageId": "boss.astria.first_meeting",
        "eventId": "event.boss.astria.first_meeting",
        "title": "初见 · 冰里还有人",
        "dialogue": [
          {
            "speaker": "零",
            "text": "冰里的孩子……眼睫还在动。",
            "lineId": "boss.astria.first_meeting.line.01"
          },
          {
            "speaker": "艾丝特莉亚",
            "text": "灯放低。别照他的脸。",
            "lineId": "boss.astria.first_meeting.line.02"
          },
          {
            "speaker": "零",
            "text": "这些人……都是你冻住的？",
            "lineId": "boss.astria.first_meeting.line.03"
          },
          {
            "speaker": "艾丝特莉亚",
            "text": "是。你要问我，就站到这边来。",
            "lineId": "boss.astria.first_meeting.line.04"
          }
        ],
        "shots": [
          {
            "seconds": 5,
            "line": {
              "speaker": "零",
              "text": "冰里的孩子……眼睫还在动。"
            },
            "shotId": "boss.astria.first_meeting.shot.01"
          },
          {
            "seconds": 5,
            "line": {
              "speaker": "艾丝特莉亚",
              "text": "灯放低。别照他的脸。"
            },
            "shotId": "boss.astria.first_meeting.shot.02"
          },
          {
            "seconds": 5,
            "line": {
              "speaker": "艾丝特莉亚",
              "text": "是。你要问我，就站到这边来。"
            },
            "shotId": "boss.astria.first_meeting.shot.03"
          }
        ]
      },
      "pre_battle": {
        "stageId": "boss.astria.pre_battle",
        "eventId": "event.boss.astria.pre_battle",
        "title": "开战 · 冰墙这边",
        "dialogue": [
          {
            "speaker": "艾丝特莉亚",
            "text": "圣堂后面就是上行的路。我不会让这盏灯过去。",
            "lineId": "boss.astria.pre_battle.line.01"
          },
          {
            "speaker": "零",
            "text": "我会把它盖好。你让我看那张画像，好不好？",
            "lineId": "boss.astria.pre_battle.line.02"
          },
          {
            "speaker": "艾丝特莉亚",
            "text": "你上次也是这样握着它，说自己还能控制。",
            "lineId": "boss.astria.pre_battle.line.03"
          }
        ],
        "shots": [
          {
            "seconds": 4,
            "line": {
              "speaker": "艾丝特莉亚",
              "text": "圣堂后面就是上行的路。我不会让这盏灯过去。"
            },
            "shotId": "boss.astria.pre_battle.shot.01"
          },
          {
            "seconds": 5,
            "line": {
              "speaker": "零",
              "text": "我会把它盖好。你让我看那张画像，好不好？"
            },
            "shotId": "boss.astria.pre_battle.shot.02"
          },
          {
            "seconds": 4,
            "line": {
              "speaker": "艾丝特莉亚",
              "text": "你上次也是这样握着它，说自己还能控制。"
            },
            "shotId": "boss.astria.pre_battle.shot.03"
          }
        ]
      },
      "phase2": {
        "stageId": "boss.astria.phase2",
        "eventId": "event.boss.astria.phase2",
        "title": "二阶段 · 六棱星冕",
        "dialogue": [
          {
            "speaker": "艾丝特莉亚",
            "text": "冰墙裂了……我听得见。",
            "lineId": "boss.astria.phase2.line.01"
          },
          {
            "speaker": "艾丝特莉亚",
            "text": "里面的人，还在等我让他们醒来。",
            "lineId": "boss.astria.phase2.line.02"
          },
          {
            "speaker": "艾丝特莉亚",
            "text": "你再往前，我就只好把你也冻住。",
            "lineId": "boss.astria.phase2.line.03"
          }
        ],
        "shots": [
          {
            "seconds": 4,
            "line": {
              "speaker": "艾丝特莉亚",
              "text": "冰墙裂了……我听得见。"
            },
            "shotId": "boss.astria.phase2.shot.01"
          },
          {
            "seconds": 5,
            "line": {
              "speaker": "艾丝特莉亚",
              "text": "里面的人，还在等我让他们醒来。"
            },
            "shotId": "boss.astria.phase2.shot.02"
          },
          {
            "seconds": 5,
            "line": {
              "speaker": "艾丝特莉亚",
              "text": "你再往前，我就只好把你也冻住。"
            },
            "shotId": "boss.astria.phase2.shot.03"
          }
        ]
      },
      "boss_defeated": {
        "stageId": "boss.astria.boss_defeated",
        "eventId": "event.boss.astria.boss_defeated",
        "title": "最终败北 · 打开表盖",
        "dialogue": [
          {
            "speaker": "艾丝特莉亚",
            "text": "表扣松了。用拇指抵住这里。",
            "lineId": "boss.astria.boss_defeated.line.01"
          },
          {
            "speaker": "零",
            "text": "白衣的是我……你和烬羽，也在。",
            "lineId": "boss.astria.boss_defeated.line.02"
          },
          {
            "speaker": "艾丝特莉亚",
            "text": "你抓着我的袖子，叫我先救他们。那只手抖得很厉害。",
            "lineId": "boss.astria.boss_defeated.line.03"
          },
          {
            "speaker": "零",
            "text": "我还以为，是你把他们困在这里……对不起。",
            "lineId": "boss.astria.boss_defeated.line.04"
          }
        ],
        "shots": [
          {
            "seconds": 5,
            "line": {
              "speaker": "艾丝特莉亚",
              "text": "表扣松了。用拇指抵住这里。"
            },
            "shotId": "boss.astria.boss_defeated.shot.01"
          },
          {
            "seconds": 6,
            "line": {
              "speaker": "零",
              "text": "白衣的是我……你和烬羽，也在。"
            },
            "shotId": "boss.astria.boss_defeated.shot.02"
          },
          {
            "seconds": 6,
            "line": {
              "speaker": "零",
              "text": "我还以为，是你把他们困在这里……对不起。"
            },
            "shotId": "boss.astria.boss_defeated.shot.03"
          }
        ]
      }
    },
    "jialan": {
      "character": "伽蓝",
      "floor": 12,
      "first_meeting_floor": 9,
      "first_meeting": {
        "stageId": "boss.jialan.first_meeting",
        "eventId": "event.boss.jialan.first_meeting",
        "title": "初见 · 雨往上走",
        "dialogue": [
          {
            "speaker": "零",
            "text": "雨往上走……那截阶梯也在动！",
            "lineId": "boss.jialan.first_meeting.line.01"
          },
          {
            "speaker": "伽蓝",
            "text": "左脚收回来。第三块是空的。",
            "lineId": "boss.jialan.first_meeting.line.02"
          },
          {
            "speaker": "零",
            "text": "是你接住的？可上面的门……",
            "lineId": "boss.jialan.first_meeting.line.03"
          },
          {
            "speaker": "伽蓝",
            "text": "我关的。等你站稳了再吵。",
            "lineId": "boss.jialan.first_meeting.line.04"
          }
        ],
        "shots": [
          {
            "seconds": 5,
            "line": {
              "speaker": "零",
              "text": "雨往上走……那截阶梯也在动！"
            },
            "shotId": "boss.jialan.first_meeting.shot.01"
          },
          {
            "seconds": 5,
            "line": {
              "speaker": "伽蓝",
              "text": "左脚收回来。第三块是空的。"
            },
            "shotId": "boss.jialan.first_meeting.shot.02"
          },
          {
            "seconds": 5,
            "line": {
              "speaker": "伽蓝",
              "text": "我关的。等你站稳了再吵。"
            },
            "shotId": "boss.jialan.first_meeting.shot.03"
          }
        ]
      },
      "pre_battle": {
        "stageId": "boss.jialan.pre_battle",
        "eventId": "event.boss.jialan.pre_battle",
        "title": "开战 · 指令仍有效",
        "dialogue": [
          {
            "speaker": "伽蓝",
            "text": "门后的机关，我已经全部锁死。",
            "lineId": "boss.jialan.pre_battle.line.01"
          },
          {
            "speaker": "零",
            "text": "把那道指令放给我听。我想知道，你到底在替谁守门。",
            "lineId": "boss.jialan.pre_battle.line.02"
          },
          {
            "speaker": "伽蓝",
            "text": "先放下灯。否则，我不能开门。",
            "lineId": "boss.jialan.pre_battle.line.03"
          }
        ],
        "shots": [
          {
            "seconds": 4,
            "line": {
              "speaker": "伽蓝",
              "text": "门后的机关，我已经全部锁死。"
            },
            "shotId": "boss.jialan.pre_battle.shot.01"
          },
          {
            "seconds": 5,
            "line": {
              "speaker": "零",
              "text": "把那道指令放给我听。我想知道，你到底在替谁守门。"
            },
            "shotId": "boss.jialan.pre_battle.shot.02"
          },
          {
            "seconds": 4,
            "line": {
              "speaker": "伽蓝",
              "text": "先放下灯。否则，我不能开门。"
            },
            "shotId": "boss.jialan.pre_battle.shot.03"
          }
        ]
      },
      "phase2": {
        "stageId": "boss.jialan.phase2",
        "eventId": "event.boss.jialan.phase2",
        "title": "二阶段 · 逆转到底",
        "dialogue": [
          {
            "speaker": "伽蓝",
            "text": "还差一格……门就能再撑一会儿。",
            "lineId": "boss.jialan.phase2.line.01"
          },
          {
            "speaker": "伽蓝",
            "text": "别碰发条。这次让我拧到底。",
            "lineId": "boss.jialan.phase2.line.02"
          },
          {
            "speaker": "零",
            "text": "停下！你胸口都裂开了！",
            "lineId": "boss.jialan.phase2.line.03"
          }
        ],
        "shots": [
          {
            "seconds": 4,
            "line": {
              "speaker": "伽蓝",
              "text": "还差一格……门就能再撑一会儿。"
            },
            "shotId": "boss.jialan.phase2.shot.01"
          },
          {
            "seconds": 5,
            "line": {
              "speaker": "伽蓝",
              "text": "别碰发条。这次让我拧到底。"
            },
            "shotId": "boss.jialan.phase2.shot.02"
          },
          {
            "seconds": 6,
            "line": {
              "speaker": "零",
              "text": "停下！你胸口都裂开了！"
            },
            "shotId": "boss.jialan.phase2.shot.03"
          }
        ]
      },
      "boss_defeated": {
        "stageId": "boss.jialan.boss_defeated",
        "eventId": "event.boss.jialan.boss_defeated",
        "title": "最终败北 · 请你听完",
        "dialogue": [
          {
            "speaker": "伽蓝",
            "text": "靠近些。声音快断了……别漏掉。",
            "lineId": "boss.jialan.boss_defeated.line.01"
          },
          {
            "speaker": "记忆中的零",
            "text": "如果我又提着灯回来，阻止我。哪怕我求你，也别开门。",
            "lineId": "boss.jialan.boss_defeated.line.02"
          },
          {
            "speaker": "伽蓝",
            "text": "塔是关住你的。你把这盏灯带上去，就能从里面打开它。",
            "lineId": "boss.jialan.boss_defeated.line.03"
          },
          {
            "speaker": "零",
            "text": "原来是我……把你们都留在这里。",
            "lineId": "boss.jialan.boss_defeated.line.04"
          }
        ],
        "shots": [
          {
            "seconds": 5,
            "line": {
              "speaker": "伽蓝",
              "text": "靠近些。声音快断了……别漏掉。"
            },
            "shotId": "boss.jialan.boss_defeated.shot.01"
          },
          {
            "seconds": 6,
            "line": {
              "speaker": "记忆中的零",
              "text": "如果我又提着灯回来，阻止我。哪怕我求你，也别开门。"
            },
            "shotId": "boss.jialan.boss_defeated.shot.02"
          },
          {
            "seconds": 6,
            "line": {
              "speaker": "零",
              "text": "原来是我……把你们都留在这里。"
            },
            "shotId": "boss.jialan.boss_defeated.shot.03"
          }
        ]
      }
    },
    "eclipse": {
      "character": "日蚀圣女",
      "floor": 16,
      "first_meeting_floor": 16,
      "first_meeting": {
        "stageId": "boss.eclipse.first_meeting",
        "eventId": "event.boss.eclipse.first_meeting",
        "title": "初见 · 相同的声音",
        "dialogue": [
          {
            "speaker": "日蚀圣女",
            "text": "醒了？把灯拿好。",
            "lineId": "boss.eclipse.first_meeting.line.01"
          },
          {
            "speaker": "零",
            "text": "是你……连声音都和棺边那时一样。",
            "lineId": "boss.eclipse.first_meeting.line.02"
          },
          {
            "speaker": "日蚀圣女",
            "text": "你把我忘在这里了。把灯给我，我们就能重新成为一个人。",
            "lineId": "boss.eclipse.first_meeting.line.03"
          },
          {
            "speaker": "零",
            "text": "先别碰灯。你让我看看你的脸。",
            "lineId": "boss.eclipse.first_meeting.line.04"
          }
        ],
        "shots": [
          {
            "seconds": 5,
            "shotId": "boss.eclipse.first_meeting.shot.01"
          },
          {
            "seconds": 6,
            "line": {
              "speaker": "日蚀圣女",
              "text": "醒了？把灯拿好。"
            },
            "shotId": "boss.eclipse.first_meeting.shot.02"
          },
          {
            "seconds": 6,
            "line": {
              "speaker": "零",
              "text": "是你……连声音都和棺边那时一样。"
            },
            "shotId": "boss.eclipse.first_meeting.shot.03"
          }
        ]
      },
      "pre_battle": {
        "stageId": "boss.eclipse.pre_battle",
        "eventId": "event.boss.eclipse.pre_battle",
        "title": "开战 · 灯留在我手里",
        "dialogue": [
          {
            "speaker": "零",
            "text": "我答应过她们。这盏灯，不能交给你。",
            "lineId": "boss.eclipse.pre_battle.line.01"
          },
          {
            "speaker": "日蚀圣女",
            "text": "她们认得你，却任你一个人从棺里爬出来。",
            "lineId": "boss.eclipse.pre_battle.line.02"
          },
          {
            "speaker": "零",
            "text": "可她们还是接住了我。你想要的，一直是灯。",
            "lineId": "boss.eclipse.pre_battle.line.03"
          }
        ],
        "shots": [
          {
            "seconds": 4,
            "line": {
              "speaker": "零",
              "text": "我答应过她们。这盏灯，不能交给你。"
            },
            "shotId": "boss.eclipse.pre_battle.shot.01"
          },
          {
            "seconds": 5,
            "line": {
              "speaker": "日蚀圣女",
              "text": "她们认得你，却任你一个人从棺里爬出来。"
            },
            "shotId": "boss.eclipse.pre_battle.shot.02"
          },
          {
            "seconds": 4,
            "line": {
              "speaker": "零",
              "text": "可她们还是接住了我。你想要的，一直是灯。"
            },
            "shotId": "boss.eclipse.pre_battle.shot.03"
          }
        ]
      },
      "phase2": {
        "stageId": "boss.eclipse.phase2",
        "eventId": "event.boss.eclipse.phase2",
        "title": "二阶段 · 黑日破镜",
        "dialogue": [
          {
            "speaker": "日蚀圣女",
            "text": "你走了，我却一直被关在这面镜子后面。",
            "lineId": "boss.eclipse.phase2.line.01"
          },
          {
            "speaker": "日蚀圣女",
            "text": "你现在要带着她们，把我再丢下一次？",
            "lineId": "boss.eclipse.phase2.line.02"
          },
          {
            "speaker": "零",
            "text": "我知道你也是我。可我不能让你再伤她们。",
            "lineId": "boss.eclipse.phase2.line.03"
          }
        ],
        "shots": [
          {
            "seconds": 4,
            "line": {
              "speaker": "日蚀圣女",
              "text": "你走了，我却一直被关在这面镜子后面。"
            },
            "shotId": "boss.eclipse.phase2.shot.01"
          },
          {
            "seconds": 5,
            "line": {
              "speaker": "日蚀圣女",
              "text": "你现在要带着她们，把我再丢下一次？"
            },
            "shotId": "boss.eclipse.phase2.shot.02"
          },
          {
            "seconds": 6,
            "line": {
              "speaker": "零",
              "text": "我知道你也是我。可我不能让你再伤她们。"
            },
            "shotId": "boss.eclipse.phase2.shot.03"
          }
        ]
      },
      "boss_defeated": {
        "stageId": "boss.eclipse.boss_defeated",
        "eventId": "event.boss.eclipse.boss_defeated",
        "title": "最终败北 · 镜后天光",
        "dialogue": [
          {
            "speaker": "日蚀圣女",
            "text": "你连自己是谁都忘了……怎么还留得住她们。",
            "lineId": "boss.eclipse.boss_defeated.line.01"
          },
          {
            "speaker": "零",
            "text": "剑穗、怀表、发条、风翎。我都带来了。",
            "lineId": "boss.eclipse.boss_defeated.line.02"
          },
          {
            "speaker": "零",
            "text": "这次，我没把她们留在身后。",
            "lineId": "boss.eclipse.boss_defeated.line.03"
          }
        ],
        "shots": [
          {
            "seconds": 5,
            "line": {
              "speaker": "日蚀圣女",
              "text": "你连自己是谁都忘了……怎么还留得住她们。"
            },
            "shotId": "boss.eclipse.boss_defeated.shot.01"
          },
          {
            "seconds": 6,
            "line": {
              "speaker": "零",
              "text": "剑穗、怀表、发条、风翎。我都带来了。"
            },
            "shotId": "boss.eclipse.boss_defeated.shot.02"
          },
          {
            "seconds": 6,
            "line": {
              "speaker": "零",
              "text": "这次，我没把她们留在身后。"
            },
            "shotId": "boss.eclipse.boss_defeated.shot.03"
          }
        ]
      }
    }
  },
  "qingyu_arc": {
    "stages": [
      {
        "stageId": "qingyu.first_contact",
        "eventId": "event.qingyu.first_contact",
        "title": "桥头初遇 · 青羽，风亭行商",
        "floor": 1,
        "dialogue": [
          {
            "lineId": "qingyu.first_contact.line.01",
            "speaker": "青羽",
            "text": "青羽，风亭的行商。药和干粮都在这儿，也帮人认些旧物。"
          },
          {
            "lineId": "qingyu.first_contact.line.02",
            "speaker": "零",
            "text": "可我连自己的名字都想不起来。你也能帮我吗？"
          },
          {
            "lineId": "qingyu.first_contact.line.03",
            "speaker": "青羽",
            "text": "能帮一点。先坐。我把茶晾凉，你慢慢说。"
          }
        ],
        "shots": [
          {
            "seconds": 8,
            "line": {
              "speaker": "青羽",
              "text": "青羽，风亭的行商。药和干粮都在这儿，也帮人认些旧物。"
            },
            "shotId": "qingyu.first_contact.shot.01"
          }
        ]
      },
      {
        "stageId": "qingyu.introduction",
        "eventId": "event.qingyu.introduction",
        "title": "第3层详谈 · 这块铭牌",
        "floor": 3,
        "dialogue": [
          {
            "speaker": "青羽",
            "text": "又淋湿了。来，牌子借我看一眼。",
            "lineId": "qingyu.introduction.line.01"
          },
          {
            "speaker": "零",
            "text": "棺里只找到这个。998……是给我的吗？",
            "lineId": "qingyu.introduction.line.02"
          },
          {
            "speaker": "青羽",
            "text": "是旧编号。磨掉的地方已经看不清了。",
            "lineId": "qingyu.introduction.line.03"
          },
          {
            "speaker": "零",
            "text": "你刚才看到数字，怎么不说话了？",
            "lineId": "qingyu.introduction.line.04"
          },
          {
            "speaker": "青羽",
            "text": "想起点旧事。先收好，以后拿它和别的东西对一对。",
            "lineId": "qingyu.introduction.line.05"
          }
        ],
        "shots": [
          {
            "seconds": 7,
            "line": {
              "speaker": "青羽",
              "text": "又淋湿了。来，牌子借我看一眼。"
            },
            "shotId": "qingyu.introduction.shot.01"
          }
        ]
      },
      {
        "stageId": "qingyu.ribbon_evidence",
        "eventId": "event.qingyu.ribbon_evidence",
        "title": "这绳结认得人",
        "floor": 5,
        "dialogue": [
          {
            "speaker": "零",
            "text": "烬羽把剑穗塞给我，连手都在抖。",
            "lineId": "qingyu.ribbon_evidence.line.01"
          },
          {
            "speaker": "青羽",
            "text": "这个歪结……她还真没舍得拆。",
            "lineId": "qingyu.ribbon_evidence.line.02"
          },
          {
            "speaker": "零",
            "text": "你认得？她说是我系的。",
            "lineId": "qingyu.ribbon_evidence.line.03"
          },
          {
            "speaker": "青羽",
            "text": "你系了三回。她嫌你慢，最后这个就不许动了。",
            "lineId": "qingyu.ribbon_evidence.line.04"
          }
        ],
        "shots": [
          {
            "seconds": 7,
            "line": {
              "speaker": "零",
              "text": "烬羽把剑穗塞给我，连手都在抖。"
            },
            "shotId": "qingyu.ribbon_evidence.shot.01"
          }
        ]
      },
      {
        "stageId": "qingyu.photo_evidence",
        "eventId": "event.qingyu.photo_evidence",
        "title": "让画像自己说话",
        "floor": 8,
        "dialogue": [
          {
            "speaker": "零",
            "text": "画像里，我贴着她们坐。那时候我们很要好，是吗？",
            "lineId": "qingyu.photo_evidence.line.01"
          },
          {
            "speaker": "青羽",
            "text": "你看烬羽的手。茶杯那么烫，她还替你托着底。",
            "lineId": "qingyu.photo_evidence.line.02"
          },
          {
            "speaker": "零",
            "text": "你也记得那天？可画像里没有你。",
            "lineId": "qingyu.photo_evidence.line.03"
          },
          {
            "speaker": "青羽",
            "text": "我在旁边，忙着添茶。你们三个倒挤得挺近。",
            "lineId": "qingyu.photo_evidence.line.04"
          }
        ],
        "shots": [
          {
            "seconds": 7,
            "line": {
              "speaker": "零",
              "text": "画像里，我贴着她们坐。那时候我们很要好，是吗？"
            },
            "shotId": "qingyu.photo_evidence.shot.01"
          }
        ]
      },
      {
        "stageId": "qingyu.command_evidence",
        "eventId": "event.qingyu.command_evidence",
        "title": "这次你自己听见了",
        "floor": 12,
        "dialogue": [
          {
            "speaker": "零",
            "text": "是我叫伽蓝关门……哪怕我回来求，也不许开。",
            "lineId": "qingyu.command_evidence.line.01"
          },
          {
            "speaker": "青羽",
            "text": "你那时怕的，就是自己忘了这句话。",
            "lineId": "qingyu.command_evidence.line.02"
          },
          {
            "speaker": "零",
            "text": "你早就知道。为什么不在桥头告诉我？",
            "lineId": "qingyu.command_evidence.line.03"
          },
          {
            "speaker": "青羽",
            "text": "告诉过。你握着灯，问我是不是也想把你关起来。",
            "lineId": "qingyu.command_evidence.line.04"
          },
          {
            "speaker": "青羽",
            "text": "我再说，你就走了。这次……我想先让你看见她们。",
            "lineId": "qingyu.command_evidence.line.05"
          }
        ],
        "shots": [
          {
            "seconds": 7,
            "line": {
              "speaker": "零",
              "text": "是我叫伽蓝关门……哪怕我回来求，也不许开。"
            },
            "shotId": "qingyu.command_evidence.shot.01"
          }
        ]
      },
      {
        "stageId": "qingyu.memory_keeper",
        "eventId": "event.qingyu.memory_keeper",
        "title": "最后一位同伴",
        "floor": 15,
        "dialogue": [
          {
            "speaker": "零",
            "text": "你总把杯子放在我惯用的那只手边。",
            "lineId": "qingyu.memory_keeper.line.01"
          },
          {
            "speaker": "青羽",
            "text": "以前一起喝茶喝惯了。想改，也没改过来。",
            "lineId": "qingyu.memory_keeper.line.02"
          },
          {
            "speaker": "零",
            "text": "可我每次回来，都把你忘了。",
            "lineId": "qingyu.memory_keeper.line.03"
          },
          {
            "speaker": "青羽",
            "text": "嗯。那就再认识一次。我叫青羽。",
            "lineId": "qingyu.memory_keeper.line.04"
          },
          {
            "speaker": "青羽",
            "text": "这根风翎也带上。最后几步，别忙着答应谁。",
            "lineId": "qingyu.memory_keeper.line.05"
          }
        ],
        "shots": [
          {
            "seconds": 7,
            "line": {
              "speaker": "零",
              "text": "你总把杯子放在我惯用的那只手边。"
            },
            "shotId": "qingyu.memory_keeper.shot.01"
          }
        ]
      }
    ]
  },
  "player_defeat": {
    "stageId": "player.defeat",
    "eventId": "event.player.defeat",
    "title": "玩家败北 · 魂灯未熄",
    "dialogue": [
      {
        "speaker": "零",
        "text": "……先别站起来。腿还在抖。",
        "lineId": "player.defeat.line.01"
      },
      {
        "speaker": "零",
        "text": "灯还亮着。让我……缓一口气。",
        "lineId": "player.defeat.line.02"
      }
    ],
    "shots": [
      {
        "seconds": 3,
        "line": {
          "speaker": "零",
          "text": "……先别站起来。腿还在抖。"
        },
        "shotId": "player.defeat.shot.01"
      },
      {
        "seconds": 3,
        "line": {
          "speaker": "零",
          "text": "灯还亮着。让我……缓一口气。"
        },
        "shotId": "player.defeat.shot.02"
      },
      {
        "seconds": 3,
        "line": {
          "speaker": "界面提示",
          "text": "你在这一层倒下了。魂灯未熄。"
        },
        "shotId": "player.defeat.shot.03"
      }
    ]
  },
  "endings": {
    "A": {
      "stageId": "ending.A",
      "eventId": "event.ending.A.enter",
      "title": "结局甲 · 神座加冕",
      "dialogue": [
        {
          "speaker": "零",
          "text": "我想把那些日子找回来。你不会再骗我了，对吗？",
          "lineId": "ending.A.line.01"
        },
        {
          "speaker": "日蚀圣女",
          "text": "过来。把灯放进我手里，就不用再想这些了。",
          "lineId": "ending.A.line.02"
        },
        {
          "speaker": "合一后的声音",
          "text": "桥没了，城也没了……有人吗？回答我。",
          "lineId": "ending.A.line.03"
        },
        {
          "speaker": "零",
          "text": "……我是谁？",
          "lineId": "ending.A.line.04"
        }
      ],
      "shots": [
        {
          "seconds": 9,
          "line": {
            "speaker": "零",
            "text": "我想把那些日子找回来。你不会再骗我了，对吗？"
          },
          "shotId": "ending.A.shot.01"
        },
        {
          "seconds": 9,
          "line": {
            "speaker": "日蚀圣女",
            "text": "过来。把灯放进我手里，就不用再想这些了。"
          },
          "shotId": "ending.A.shot.02"
        },
        {
          "seconds": 10,
          "line": {
            "speaker": "合一后的声音",
            "text": "桥没了，城也没了……有人吗？回答我。"
          },
          "shotId": "ending.A.shot.03"
        }
      ],
      "final_text": "第一千次轮回。"
    },
    "B": {
      "stageId": "ending.B",
      "eventId": "event.ending.B.enter",
      "title": "结局乙 · 第一千道黎明",
      "dialogue": [
        {
          "speaker": "零",
          "text": "这些影子……烬羽，是你们吗？",
          "lineId": "ending.B.line.01"
        },
        {
          "speaker": "日蚀圣女",
          "text": "灯都快熄了。你还要一个人撑下去？",
          "lineId": "ending.B.line.02"
        },
        {
          "speaker": "零",
          "text": "不是一个人。你看，她们的手还在这里。",
          "lineId": "ending.B.line.03"
        },
        {
          "speaker": "青羽的记忆",
          "text": "别站在雨里。茶要凉了。",
          "lineId": "ending.B.line.04"
        },
        {
          "speaker": "零",
          "text": "嗯……这次，我记得路了。",
          "lineId": "ending.B.line.05"
        }
      ],
      "shots": [
        {
          "seconds": 9,
          "line": {
            "speaker": "零",
            "text": "这些影子……烬羽，是你们吗？"
          },
          "shotId": "ending.B.shot.01"
        },
        {
          "seconds": 9,
          "line": {
            "speaker": "日蚀圣女",
            "text": "灯都快熄了。你还要一个人撑下去？"
          },
          "shotId": "ending.B.shot.02"
        },
        {
          "seconds": 10,
          "line": {
            "speaker": "零",
            "text": "不是一个人。你看，她们的手还在这里。"
          },
          "shotId": "ending.B.shot.03"
        }
      ],
      "final_text": "这一次，灯可以熄了。"
    }
  }
};
if (typeof globalThis !== "undefined") globalThis.SpireStoryV2 = SpireStoryV2;
