import {
  ConversationArea,
  Interactable,
  PosterSessionArea,
  ViewingArea,
  ListeningArea,
} from './CoveyTownSocket';

/**
 * Test to see if an interactable is a conversation area
 */
export function isConversationArea(interactable: Interactable): interactable is ConversationArea {
  return 'occupantsByID' in interactable;
}

/**
 * Test to see if an interactable is a viewing area
 */
export function isViewingArea(interactable: Interactable): interactable is ViewingArea {
  return 'isPlaying' in interactable;
}

/**
 * Test to see if an interactable is a listening area
 */
export function isListeningArea(interactable: Interactable): interactable is ListeningArea {
  return 'song' in interactable;
}

/**
 * Test to see if an interactable is a poster session area
 */
export function isPosterSessionArea(interactable: Interactable): interactable is PosterSessionArea {
  return 'stars' in interactable;
}
