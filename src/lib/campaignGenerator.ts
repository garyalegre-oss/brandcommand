import { Brand, Post, PostFormat, SocialChannel } from '../types/brand';
import { generateBrandContent } from './contentGenerator';

export interface CampaignPlanDay {
  dayNumber: number;
  dayName: string;
  theme: string;
  format: PostFormat;
  scheduledDate: string;
  post: Omit<Post, 'id' | 'createdAt'>;
}

export function generate7DayCampaign(brand: Brand, campaignFocus?: string): CampaignPlanDay[] {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const focus = campaignFocus?.trim() || brand.tagline;

  const scheduleOffsets = [1, 2, 3, 4, 5, 6, 7];

  const planTemplates: Array<{
    format: PostFormat;
    themePrefix: string;
    channelPicks: SocialChannel[];
    hour: number;
  }> = [
    {
      format: 'video_script',
      themePrefix: 'The Hard Truth About',
      channelPicks: ['tiktok', 'instagram', 'youtube'],
      hour: 17 // 5 PM
    },
    {
      format: 'carousel',
      themePrefix: 'Step-by-Step Visual Framework:',
      channelPicks: ['linkedin', 'instagram', 'twitter'],
      hour: 10 // 10 AM
    },
    {
      format: 'thread',
      themePrefix: 'Tactical Breakdown: 5 Costly Mistakes in',
      channelPicks: ['twitter', 'linkedin'],
      hour: 14 // 2 PM
    },
    {
      format: 'newsletter',
      themePrefix: 'Exclusive Weekly Brief:',
      channelPicks: ['twitter', 'linkedin'],
      hour: 9 // 9 AM
    },
    {
      format: 'video_script',
      themePrefix: 'Watch This Before You Spend A Dollar On',
      channelPicks: ['tiktok', 'instagram', 'youtube'],
      hour: 18 // 6 PM
    },
    {
      format: 'carousel',
      themePrefix: 'The Ultimate Checklist for',
      channelPicks: ['linkedin', 'instagram', 'pinterest'],
      hour: 11 // 11 AM
    },
    {
      format: 'single',
      themePrefix: 'Weekend Community Debate:',
      channelPicks: ['twitter', 'instagram', 'facebook'],
      hour: 15 // 3 PM
    }
  ];

  return planTemplates.map((template, idx) => {
    const dayNumber = idx + 1;
    const dayDate = new Date();
    dayDate.setDate(dayDate.getDate() + scheduleOffsets[idx]);
    dayDate.setHours(template.hour, 0, 0, 0);

    const topicVariation = brand.suggestedTopics[idx % brand.suggestedTopics.length] || focus;
    const compositeTopic = `${template.themePrefix} ${topicVariation}`;

    const gen = generateBrandContent(brand, compositeTopic, template.format);

    const matchedChannels = brand.defaultChannels.filter((c) => template.channelPicks.includes(c));

    const post: Omit<Post, 'id' | 'createdAt'> = {
      brandId: brand.id,
      title: gen.title,
      content: gen.content,
      format: gen.format,
      status: 'scheduled',
      scheduledFor: dayDate.toISOString(),
      channels: matchedChannels.length > 0 ? matchedChannels : brand.defaultChannels,
      carouselSlides: gen.carouselSlides,
      videoScript: gen.videoScript,
      threadTweets: gen.threadTweets,
      emailCampaign: gen.emailCampaign,
      tags: gen.tags
    };

    return {
      dayNumber,
      dayName: days[dayDate.getDay() === 0 ? 6 : dayDate.getDay() - 1],
      theme: compositeTopic,
      format: template.format,
      scheduledDate: dayDate.toISOString(),
      post
    };
  });
}
