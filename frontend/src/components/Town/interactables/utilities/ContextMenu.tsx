import React, { useState } from 'react';
import { Box, Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/react';

function ContextMenu() {
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsContextMenuOpen(true);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
  };

  const handleCloseContextMenu = () => {
    setIsContextMenuOpen(false);
  };

  return (
    <Box onContextMenu={handleContextMenu}>
      <Menu isOpen={isContextMenuOpen} onClose={handleCloseContextMenu}>
        <MenuButton
          as={Box}
          pos='absolute'
          left={contextMenuPosition.x}
          top={contextMenuPosition.y}
          zIndex={9999}
        />
        <MenuList>
          <MenuItem onClick={() => alert('Copy')}>Add to Queue</MenuItem>
        </MenuList>
      </Menu>
    </Box>
  );
}
