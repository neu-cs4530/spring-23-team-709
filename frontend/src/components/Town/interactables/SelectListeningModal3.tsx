import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useToast,
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useState } from 'react';
import { useListeningAreaController } from '../../../classes/TownController';
import useTownController from '../../../hooks/useTownController';
import { ListeningArea as ListeningAreaModel } from '../../../types/CoveyTownSocket';
import ListeningArea from './ListeningArea';

export default function SelectListeningModal({
  isOpen,
  close,
  listeningArea,
}: {
  isOpen: boolean;
  close: () => void;
  listeningArea: ListeningArea;
}): JSX.Element {
  const coveyTownController = useTownController();
  const listeningAreaController = useListeningAreaController(listeningArea?.name);

  const [song, setSong] = useState<string>(listeningArea?.defaultSong || '');

  useEffect(() => {
    console.log('Got Here');
    if (isOpen) {
      coveyTownController.pause();
    } else {
      coveyTownController.unPause();
    }
  }, [coveyTownController, isOpen]);

  const closeModal = useCallback(() => {
    coveyTownController.unPause();
    close();
  }, [coveyTownController, close]);

  const toast = useToast();

  const createListeningArea = useCallback(async () => {
    if (song && listeningAreaController) {
      const request: ListeningAreaModel = {
        id: listeningAreaController.id,
        song,
        isPlaying: true,
      };
      try {
        await coveyTownController.createListeningArea(request);
        toast({
          title: 'Song set!',
          status: 'success',
        });
        coveyTownController.unPause();
      } catch (err) {
        if (err instanceof Error) {
          toast({
            title: 'Unable to set song URL',
            description: err.toString(),
            status: 'error',
          });
        } else {
          console.trace(err);
          toast({
            title: 'Unexpected Error',
            status: 'error',
          });
        }
      }
    }
  }, [song, coveyTownController, listeningAreaController, toast]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        closeModal();
        coveyTownController.unPause();
      }}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Pick a song to listen to {listeningAreaController?.id} </ModalHeader>
        <ModalCloseButton />
        <form
          onSubmit={ev => {
            ev.preventDefault();
            createListeningArea();
          }}>
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel htmlFor='song'> Song </FormLabel>
              <Input id='song' name='song' value={song} onChange={e => setSong(e.target.value)} />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme='blue' mr={3} onClick={createListeningArea}>
              Set song
            </Button>
            <Button onClick={closeModal}>Cancel</Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
