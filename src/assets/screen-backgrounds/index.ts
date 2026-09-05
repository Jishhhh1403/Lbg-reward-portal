import coPlan1 from './Co-plan/image.png'
import coPlan2 from './Co-plan/image (1).png'
import cognitive1 from './Cognitive-evidence/image.png'
import cognitive2 from './Cognitive-evidence/image (1).png'
import cognitive3 from './Cognitive-evidence/image (2).png'
import objective1 from './Objective-screen/obj-1.png'
import objective2 from './Objective-screen/obj-2.png'
import objective3 from './Objective-screen/obj-3.png'
import taskComplete1 from './Task-completion/image.png'
import taskComplete2 from './Task-completion/image (1).png'
import taskComplete3 from './Task-completion/image (2).png'
import execution1 from './execution-steps/image.png'
import execution2 from './execution-steps/image (1).png'
import execution3 from './execution-steps/image (2).png'
import monitor1 from './moniter/image.png'
import monitor2 from './moniter/image (1).png'
import monitor3 from './moniter/image (2).png'
import summary1 from './objective-summery/image.png'
import summary2 from './objective-summery/image (1).png'
import summary3 from './objective-summery/image (2).png'
import redirect1 from './redirect/image.png'
import redirect2 from './redirect/image (1).png'
import redirect3 from './redirect/image (2).png'
import retain1 from './retain/image.png'
import retain2 from './retain/image (1).png'
import retain3 from './retain/image (2).png'
import opportunities1 from './reward-opportunites/image.png'
import opportunities2 from './reward-opportunites/image (1).png'
import opportunities3 from './reward-opportunites/image (2).png'

/**
 * Every screen-background image grouped by its source folder. Keys mirror the
 * folder names in src/assets/screen-backgrounds so a workspace screen can pick
 * (at random) one of the images that belong to it.
 */
export const SCREEN_BACKGROUNDS: Record<string, string[]> = {
  'Co-plan': [coPlan1, coPlan2],
  'Cognitive-evidence': [cognitive1, cognitive2, cognitive3],
  'Objective-screen': [objective1, objective2, objective3],
  'Task-completion': [taskComplete1, taskComplete2, taskComplete3],
  'execution-steps': [execution1, execution2, execution3],
  moniter: [monitor1, monitor2, monitor3],
  'objective-summery': [summary1, summary2, summary3],
  redirect: [redirect1, redirect2, redirect3],
  retain: [retain1, retain2, retain3],
  'reward-opportunites': [opportunities1, opportunities2, opportunities3],
}

export type ScreenBackgroundKey = keyof typeof SCREEN_BACKGROUNDS