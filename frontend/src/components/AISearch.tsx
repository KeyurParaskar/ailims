import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  CircularProgress,
  Chip,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScienceIcon from '@mui/icons-material/Science';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import DescriptionIcon from '@mui/icons-material/Description';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { aiSearch } from '../services/api';

interface SearchResult {
  type: 'workflow' | 'sample' | 'document';
  id: string;
  title: string;
  description: string;
  relevance: number;
}

interface AISearchProps {
  onResultSelect?: (result: SearchResult) => void;
}

const getIcon = (type: string) => {
  switch (type) {
    case 'workflow':
      return <AccountTreeIcon color="primary" />;
    case 'sample':
      return <ScienceIcon color="secondary" />;
    case 'document':
      return <DescriptionIcon color="action" />;
    default:
      return <SearchIcon />;
  }
};

const AISearch: React.FC<AISearchProps> = ({ onResultSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
  } = useSpeechRecognition();

  // Update query when voice transcript changes
  useEffect(() => {
    if (transcript) {
      setQuery(transcript);
    }
  }, [transcript]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setShowResults(true);

    try {
      const response = await aiSearch(query);
      if (response.success) {
        setResults(response.results);
      }
    } catch (error) {
      console.error('Search error:', error);
      // Fallback mock results for demo
      setResults([
        {
          type: 'workflow',
          id: 'wf-1',
          title: 'Blood Sample Analysis',
          description: 'Standard workflow for blood sample testing',
          relevance: 0.95,
        },
        {
          type: 'sample',
          id: 'smp-1',
          title: 'Sample #A1234',
          description: 'Blood sample from patient John Doe',
          relevance: 0.87,
        },
      ]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
      // Trigger search after voice input
      if (transcript) {
        setTimeout(handleSearch, 300);
      }
    } else {
      resetTranscript();
      startListening();
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (onResultSelect) {
      onResultSelect(result);
    }
    setShowResults(false);
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', maxWidth: 500 }}>
      <TextField
        fullWidth
        placeholder="Search workflows, samples, or ask a question..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          resetTranscript();
        }}
        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        onFocus={() => results.length > 0 && setShowResults(true)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {isSearching && <CircularProgress size={20} sx={{ mr: 1 }} />}
              {isSupported && (
                <Tooltip title={isListening ? 'Stop listening' : 'Voice search'}>
                  <IconButton
                    onClick={handleVoiceToggle}
                    color={isListening ? 'error' : 'default'}
                    sx={{
                      animation: isListening ? 'pulse 1.5s infinite' : 'none',
                      '@keyframes pulse': {
                        '0%': { opacity: 1 },
                        '50%': { opacity: 0.5 },
                        '100%': { opacity: 1 },
                      },
                    }}
                  >
                    {isListening ? <MicOffIcon /> : <MicIcon />}
                  </IconButton>
                </Tooltip>
              )}
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            bgcolor: 'background.paper',
          },
        }}
      />

      {/* Search Results Dropdown */}
      {showResults && results.length > 0 && (
        <Paper
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 1,
            maxHeight: 400,
            overflow: 'auto',
            zIndex: 1000,
          }}
          elevation={3}
        >
          <List>
            {results.map((result) => (
              <ListItem
                key={result.id}
                button
                onClick={() => handleResultClick(result)}
                sx={{
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <ListItemIcon>{getIcon(result.type)}</ListItemIcon>
                <ListItemText
                  primary={result.title}
                  secondary={result.description}
                />
                <Chip
                  label={result.type}
                  size="small"
                  variant="outlined"
                  sx={{ ml: 1 }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Voice listening indicator */}
      {isListening && (
        <Typography
          variant="caption"
          color="error"
          sx={{ mt: 0.5, display: 'block' }}
        >
          🎤 Listening... Speak now
        </Typography>
      )}
    </Box>
  );
};

export default AISearch;
