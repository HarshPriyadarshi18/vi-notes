import Session from '../models/Session.js';

export const saveSession = async (req, res) => {
  try {
    const {
      content,
      totalTypedChars,
      totalPastedChars,
      pasteRatio,
      pasteEvents,
      keystrokeEvents
    } = req.body;

    let session = await Session.findOne({ userId: req.userId });

    if (session) {
      // Update existing session
      session.content = content;
      session.totalTypedChars = totalTypedChars;
      session.totalPastedChars = totalPastedChars;
      session.pasteRatio = pasteRatio;
      session.pasteEvents = pasteEvents;
      session.keystrokeEvents = keystrokeEvents;
      session.updatedAt = new Date();
    } else {
      // Create new session
      session = new Session({
        userId: req.userId,
        content,
        totalTypedChars,
        totalPastedChars,
        pasteRatio,
        pasteEvents,
        keystrokeEvents
      });
    }

    await session.save();

    res.json({
      message: 'Session saved successfully',
      session
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSession = async (req, res) => {
  try {
    const session = await Session.findOne({ userId: req.userId });

    if (!session) {
      return res.json({ session: null });
    }

    res.json({ session });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSessionStats = async (req, res) => {
  try {
    const session = await Session.findOne({ userId: req.userId });

    if (!session) {
      return res.json({
        stats: {
          totalTypedChars: 0,
          totalPastedChars: 0,
          pasteRatio: 0,
          pasteCount: 0
        }
      });
    }

    res.json({
      stats: {
        totalTypedChars: session.totalTypedChars,
        totalPastedChars: session.totalPastedChars,
        pasteRatio: session.pasteRatio,
        pasteCount: session.pasteEvents.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
