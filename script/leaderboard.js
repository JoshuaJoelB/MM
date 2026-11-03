/* ================================================================
   LEADERBOARD.JS — Supabase Integration
   ================================================================ */
(function () {
  'use strict';

  const SUBJECTS = ['computer', 'science', 'ap'];
  const DISPLAY_LIMIT = 10;

  async function recordWin(result) {
    if (!result || !result.nickname) return false;
    const client = window.MM_Supabase;
    if (!client) {
      console.error("Supabase not initialized!");
      return false;
    }

    try {
      // 1. Find or Create Player
      let { data: player, error: pError } = await client
        .from('players')
        .select('id')
        .eq('nickname', result.nickname)
        .single();

      if (pError && pError.code === 'PGRST116') { 
        const { data: newPlayer, error: createError } = await client
          .from('players')
          .insert([{ nickname: result.nickname }])
          .select()
          .single();
        if (createError) throw createError;
        player = newPlayer;
      } else if (pError) {
        throw pError;
      }

      // 2. Save Level Progress
      const timeSpent = Math.max(0, Math.round(result.time || 0));
      const starsEarned = Math.max(0, Math.min(3, result.stars || 0));

      const { error: progError } = await client
        .from('player_progress')
        .upsert({
          player_id: player.id,
          subject: result.subject,
          level: result.level,
          time_spent: timeSpent,
          stars_earned: starsEarned,
          is_completed: true
        }, { onConflict: 'player_id,subject,level' });

      if (progError) throw progError;

      // 3. Update Player Points
      await client.rpc('increment_player_stats', {
        p_id: player.id,
        p_points: result.pointsEarned || 0,
        p_stars: starsEarned
      });

      console.log("✅ Data successfully saved to Supabase");
      return true;
    } catch (err) {
      console.error("❌ Supabase recordWin Error:", err);
      return false;
    }
  }

  async function getAllForSubject(subject) {
    const client = window.MM_Supabase;
    if (!client) return [];

    try {
      const { data, error } = await client
        .from('leaderboards')
        .select('*')
        .eq('subject', subject)
        .order('highest_level', { ascending: false })
        .order('best_time', { ascending: true })
        .order('total_stars', { ascending: false })
        .limit(DISPLAY_LIMIT);

      if (error) throw error;
      
      return (data || []).map(row => ({
        nickname: row.nickname,
        highestLevel: row.highest_level,
        bestTime: row.best_time,
        totalStars: row.total_stars,
        totalPoints: row.total_points
      }));
    } catch (err) {
      console.error("❌ Supabase Fetch Error:", err);
      return [];
    }
  }

  window.MMLeaderboard = {
    recordWin: recordWin,
    getAllForSubject: getAllForSubject,
    prune: () => {},
    removePlayer: () => {},
    clearAll: () => {},
    SUBJECTS: SUBJECTS,
    DISPLAY_LIMIT: DISPLAY_LIMIT
  };
})();