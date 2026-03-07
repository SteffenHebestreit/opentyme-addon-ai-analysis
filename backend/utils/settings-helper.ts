/**
 * Settings Helper
 * 
 * Utility for accessing plugin settings from the database.
 */

export class SettingsHelper {
  /**
   * Get plugin settings for a user from the database
   */
  static async getUserSettings(pool: any, userId: string, pluginName: string): Promise<any> {
    try {
      const result = await pool.query(
        `SELECT plugins_config FROM settings WHERE user_id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const pluginsConfig = result.rows[0].plugins_config || {};
      return pluginsConfig[pluginName];
    } catch (error: any) {
      console.error(`[${pluginName}] Error getting settings:`, error.message);
      return null;
    }
  }

  /**
   * Check if plugin is enabled for a user
   */
  static async isEnabled(pool: any, userId: string, pluginName: string): Promise<boolean> {
    const settings = await this.getUserSettings(pool, userId, pluginName);
    return settings?.enabled ?? false;
  }

  /**
   * Get plugin config for a user
   */
  static async getConfig(pool: any, userId: string, pluginName: string): Promise<Record<string, any>> {
    const settings = await this.getUserSettings(pool, userId, pluginName);
    return settings?.config ?? {};
  }
}
